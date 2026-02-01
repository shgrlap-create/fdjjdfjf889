from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
import base64

# Import extended movies database (50 films)
from movies_data import MOCK_MOVIES, ALL_MOVIE_IDS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MovieNode(BaseModel):
    id: str
    title: str
    title_ru: Optional[str] = None
    year: int
    poster: Optional[str] = None
    vibe: str
    is_top: bool = False

class MovieLink(BaseModel):
    source: str
    target: str
    strength: float = 0.5

class GraphResponse(BaseModel):
    nodes: List[MovieNode]
    links: List[MovieLink]
    query_summary: str

class QueryRequest(BaseModel):
    query: str

class QueryValidation(BaseModel):
    is_valid: bool
    error_message: Optional[str] = None
    suggestions: List[str] = []

class MagicLinkRequest(BaseModel):
    email: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Process session_id from Emergent Auth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    auth_data = auth_response.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"email": auth_data["email"]},
            {"$set": {
                "name": auth_data.get("name", ""),
                "picture": auth_data.get("picture", "")
            }}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data.get("name", ""),
            "picture": auth_data.get("picture", ""),
            "avatar": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

@api_router.post("/auth/magic-link")
async def send_magic_link(data: MagicLinkRequest):
    """Send magic link email"""
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": data.email,
            "name": data.email.split("@")[0],
            "picture": None,
            "avatar": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    magic_token = f"magic_{uuid.uuid4().hex}"
    await db.magic_links.insert_one({
        "token": magic_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Magic link sent", "demo_token": magic_token}

@api_router.post("/auth/magic-link/verify")
async def verify_magic_link(request: Request, response: Response):
    """Verify magic link token"""
    body = await request.json()
    token = body.get("token")
    
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    magic_doc = await db.magic_links.find_one({"token": token}, {"_id": 0})
    if not magic_doc:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    expires_at = datetime.fromisoformat(magic_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Token expired")
    
    await db.magic_links.delete_one({"token": token})
    
    session_token = f"sess_{uuid.uuid4().hex}"
    session_expires = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": magic_doc["user_id"],
        "session_token": session_token,
        "expires_at": session_expires.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": magic_doc["user_id"]}, {"_id": 0})
    return user_doc

# ============== PROFILE ENDPOINTS ==============

@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, request: Request):
    """Update user profile"""
    user = await require_auth(request)
    
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.avatar is not None:
        update_data["avatar"] = data.avatar
    
    if update_data:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_data}
        )
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc

@api_router.get("/profile")
async def get_profile(request: Request):
    """Get user profile"""
    user = await require_auth(request)
    return user.model_dump()

# ============== AI MOVIE RECOMMENDATIONS ==============

async def validate_query_with_ai(query: str) -> QueryValidation:
    """Validate user query using GPT-5.2"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"validate_{uuid.uuid4().hex[:8]}",
        system_message="""Ты - валидатор запросов для системы рекомендаций фильмов.
        
Твоя задача - проверить, является ли запрос пользователя осмысленным запросом о фильмах.

ХОРОШИЙ запрос должен содержать хотя бы одно из:
- Упоминание конкретного фильма для сравнения
- Описание настроения или атмосферы
- Жанр или тематику
- Темп или стиль повествования

ПЛОХОЙ запрос:
- Слишком общий ("хороший фильм", "что посмотреть")
- Не о фильмах вообще
- Бессмысленный текст

Отвечай ТОЛЬКО в формате JSON:
{
    "is_valid": true/false,
    "error_message": "сообщение об ошибке или null",
    "suggestions": ["пример хорошего запроса 1", "пример 2", "пример 3"]
}"""
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_message(UserMessage(text=f"Проверь этот запрос: {query}"))
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        result = json.loads(response_text)
        return QueryValidation(**result)
    except Exception as e:
        logger.error(f"AI validation error: {e}")
        if len(query.strip()) < 10:
            return QueryValidation(
                is_valid=False,
                error_message="Слишком короткий запрос",
                suggestions=[
                    "Подбери фильм как Интерстеллар, но медленнее",
                    "Хочу мрачный триллер с неожиданной концовкой",
                    "Что-то философское про искусственный интеллект"
                ]
            )
        return QueryValidation(is_valid=True)

# Generate list of all movies for AI prompt
ALL_MOVIES_STR = """- arrival (Прибытие, 2016) - философская sci-fi
- blade_runner_2049 (Бегущий по лезвию 2049, 2017) - неонуар
- interstellar (Интерстеллар, 2014) - эпическая sci-fi
- matrix (Матрица, 1999) - киберпанк
- inception (Начало, 2010) - сны
- ex_machina (Из машины, 2014) - камерная sci-fi
- gattaca (Гаттака, 1997) - интеллектуальная sci-fi
- her (Она, 2013) - романтическая sci-fi
- moon (Луна 2112, 2009) - камерная sci-fi
- solaris (Солярис, 1972) - философская классика
- stalker (Сталкер, 1979) - медитативное кино
- 2001 (Космическая одиссея, 1968) - визионерская классика
- eternal_sunshine (Вечное сияние, 2004) - романтика и память
- annihilation (Аннигиляция, 2018) - sci-fi хоррор
- dune (Дюна, 2021) - эпическая фантастика
- gravity (Гравитация, 2013) - космический триллер
- the_martian (Марсианин, 2015) - научная фантастика
- drive (Драйв, 2011) - минималистичный криминал
- memento (Помни, 2000) - психологический триллер
- prisoners (Пленницы, 2013) - мрачный триллер
- no_country (Старикам тут не место, 2007) - криминальная драма
- prestige (Престиж, 2006) - загадочный триллер
- shutter_island (Остров проклятых, 2010) - психологический триллер
- fight_club (Бойцовский клуб, 1999) - культовая драма
- silence_lambs (Молчание ягнят, 1991) - криминальный триллер
- seven (Семь, 1995) - мрачный детектив
- gone_girl (Исчезнувшая, 2014) - триллер
- zodiac (Зодиак, 2007) - криминальная драма
- sicario (Убийца, 2015) - напряжённый боевик
- nightcrawler (Стрингер, 2014) - тёмная драма
- donnie_darko (Донни Дарко, 2001) - культовая мистика
- mulholland_drive (Малхолланд Драйв, 2001) - загадочный нуар
- lost_in_translation (Трудности перевода, 2003) - меланхолия
- requiem_dream (Реквием по мечте, 2000) - визуальный стиль
- american_beauty (Красота по-американски, 1999) - социальная сатира
- there_will_be_blood (Нефть, 2007) - эпическая драма
- whiplash (Одержимость, 2014) - напряжённая драма
- social_network (Социальная сеть, 2010) - острый диалог
- black_swan (Чёрный лебедь, 2010) - психологический триллер
- shining (Сияние, 1980) - классика хоррора
- get_out (Прочь, 2017) - социальный хоррор
- hereditary (Реинкарнация, 2018) - атмосферный хоррор
- midsommar (Солнцестояние, 2019) - фолк-хоррор
- sixth_sense (Шестое чувство, 1999) - классика мистики
- dark_knight (Тёмный рыцарь, 2008) - супергеройский эпик
- pulp_fiction (Криминальное чтиво, 1994) - культовая классика
- goodfellas (Славные парни, 1990) - гангстерская классика
- heat (Схватка, 1995) - эпическая криминальная драма
- departed (Отступники, 2006) - напряжённый триллер
- oldboy (Олдбой, 2003) - корейский шедевр
- parasite (Паразиты, 2019) - социальная сатира
- la_la_land (Ла-Ла Ленд, 2016) - музыкальный шедевр
- mad_max_fury (Безумный Макс, 2015) - визуальный экшен
- joker (Джокер, 2019) - характерная драма
- tenet (Довод, 2020) - временные парадоксы
- oppenheimer (Оппенгеймер, 2023) - эпическая биография"""

async def get_movie_recommendations(query: str) -> GraphResponse:
    """Get movie recommendations using GPT-5.2"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"recommend_{uuid.uuid4().hex[:8]}",
        system_message=f"""Ты - эксперт по кино, который подбирает фильмы под настроение пользователя.

На основе запроса пользователя, выбери 35-45 фильмов из этого списка:
{ALL_MOVIES_STR}

Выбери 5-7 TOP фильмов (is_top: true), которые ЛУЧШЕ ВСЕГО подходят под запрос.
Остальные 30-38 - связанные по теме/настроению (is_top: false).

Отвечай СТРОГО в формате JSON:
{{
    "nodes": [
        {{"id": "arrival", "title": "Arrival", "title_ru": "Прибытие", "year": 2016, "vibe": "философская тишина", "is_top": true}},
        ...
    ],
    "links": [
        {{"source": "arrival", "target": "her", "strength": 0.7}},
        ...
    ],
    "query_summary": "Краткое описание того, что подобрано (1-2 предложения)"
}}

Создай много связей между фильмами (40-60 links) для красивого графа."""
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_message(UserMessage(text=query))
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        result = json.loads(response_text)
        
        # Add poster URLs to nodes
        for node in result["nodes"]:
            if node["id"] in MOCK_MOVIES:
                node["poster"] = MOCK_MOVIES[node["id"]].poster
        
        return GraphResponse(**result)
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        # Fallback with more movies
        fallback_nodes = [
            MovieNode(id="arrival", title="Arrival", title_ru="Прибытие", year=2016, vibe="философская тишина", is_top=True, poster=MOCK_MOVIES["arrival"].poster),
            MovieNode(id="blade_runner_2049", title="Blade Runner 2049", title_ru="Бегущий по лезвию 2049", year=2017, vibe="неонуар", is_top=True, poster=MOCK_MOVIES["blade_runner_2049"].poster),
            MovieNode(id="interstellar", title="Interstellar", title_ru="Интерстеллар", year=2014, vibe="эпическая sci-fi", is_top=True, poster=MOCK_MOVIES["interstellar"].poster),
            MovieNode(id="inception", title="Inception", title_ru="Начало", year=2010, vibe="сны и реальность", is_top=True, poster=MOCK_MOVIES["inception"].poster),
            MovieNode(id="matrix", title="The Matrix", title_ru="Матрица", year=1999, vibe="киберпанк", is_top=True, poster=MOCK_MOVIES["matrix"].poster),
            MovieNode(id="drive", title="Drive", title_ru="Драйв", year=2011, vibe="минимализм", is_top=False, poster=MOCK_MOVIES["drive"].poster),
            MovieNode(id="gattaca", title="Gattaca", title_ru="Гаттака", year=1997, vibe="интеллектуальная", is_top=False, poster=MOCK_MOVIES["gattaca"].poster),
            MovieNode(id="memento", title="Memento", title_ru="Помни", year=2000, vibe="психологический", is_top=False, poster=MOCK_MOVIES["memento"].poster),
            MovieNode(id="prisoners", title="Prisoners", title_ru="Пленницы", year=2013, vibe="мрачный", is_top=False, poster=MOCK_MOVIES["prisoners"].poster),
            MovieNode(id="her", title="Her", title_ru="Она", year=2013, vibe="романтический", is_top=False, poster=MOCK_MOVIES["her"].poster),
            MovieNode(id="no_country", title="No Country for Old Men", title_ru="Старикам тут не место", year=2007, vibe="напряжённый", is_top=False, poster=MOCK_MOVIES["no_country"].poster),
            MovieNode(id="ex_machina", title="Ex Machina", title_ru="Из машины", year=2014, vibe="камерная sci-fi", is_top=False, poster=MOCK_MOVIES["ex_machina"].poster),
            MovieNode(id="moon", title="Moon", title_ru="Луна 2112", year=2009, vibe="одиночество", is_top=False, poster=MOCK_MOVIES["moon"].poster),
            MovieNode(id="prestige", title="The Prestige", title_ru="Престиж", year=2006, vibe="загадочный", is_top=False, poster=MOCK_MOVIES["prestige"].poster),
            MovieNode(id="fight_club", title="Fight Club", title_ru="Бойцовский клуб", year=1999, vibe="культовый", is_top=False, poster=MOCK_MOVIES["fight_club"].poster),
            MovieNode(id="seven", title="Se7en", title_ru="Семь", year=1995, vibe="мрачный детектив", is_top=False, poster=MOCK_MOVIES["seven"].poster),
            MovieNode(id="shutter_island", title="Shutter Island", title_ru="Остров проклятых", year=2010, vibe="психологический", is_top=False, poster=MOCK_MOVIES["shutter_island"].poster),
            MovieNode(id="donnie_darko", title="Donnie Darko", title_ru="Донни Дарко", year=2001, vibe="мистика", is_top=False, poster=MOCK_MOVIES["donnie_darko"].poster),
            MovieNode(id="eternal_sunshine", title="Eternal Sunshine", title_ru="Вечное сияние", year=2004, vibe="романтика", is_top=False, poster=MOCK_MOVIES["eternal_sunshine"].poster),
            MovieNode(id="solaris", title="Solaris", title_ru="Солярис", year=1972, vibe="философский", is_top=False, poster=MOCK_MOVIES["solaris"].poster),
        ]
        fallback_links = [
            MovieLink(source="arrival", target="interstellar", strength=0.9),
            MovieLink(source="arrival", target="her", strength=0.7),
            MovieLink(source="arrival", target="gattaca", strength=0.8),
            MovieLink(source="blade_runner_2049", target="drive", strength=0.6),
            MovieLink(source="blade_runner_2049", target="gattaca", strength=0.7),
            MovieLink(source="blade_runner_2049", target="ex_machina", strength=0.8),
            MovieLink(source="interstellar", target="inception", strength=0.9),
            MovieLink(source="interstellar", target="matrix", strength=0.6),
            MovieLink(source="inception", target="memento", strength=0.8),
            MovieLink(source="inception", target="prestige", strength=0.9),
            MovieLink(source="matrix", target="fight_club", strength=0.5),
            MovieLink(source="drive", target="no_country", strength=0.5),
            MovieLink(source="memento", target="prisoners", strength=0.6),
            MovieLink(source="memento", target="shutter_island", strength=0.8),
            MovieLink(source="gattaca", target="ex_machina", strength=0.8),
            MovieLink(source="her", target="ex_machina", strength=0.7),
            MovieLink(source="her", target="eternal_sunshine", strength=0.9),
            MovieLink(source="moon", target="solaris", strength=0.7),
            MovieLink(source="seven", target="prisoners", strength=0.7),
            MovieLink(source="donnie_darko", target="eternal_sunshine", strength=0.5),
        ]
        return GraphResponse(
            nodes=fallback_nodes,
            links=fallback_links,
            query_summary="Подобрано философское кино с глубоким смыслом и атмосферой."
        )

# ============== MOVIE ENDPOINTS ==============

@api_router.post("/movies/validate", response_model=QueryValidation)
async def validate_query(data: QueryRequest):
    """Validate movie search query"""
    return await validate_query_with_ai(data.query)

@api_router.post("/movies/recommend", response_model=GraphResponse)
async def get_recommendations(data: QueryRequest, request: Request):
    """Get movie recommendations graph"""
    user = await get_current_user(request)
    
    if user:
        await db.search_history.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user.user_id,
            "query": data.query,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return await get_movie_recommendations(data.query)

@api_router.get("/movies/{movie_id}")
async def get_movie_detail(movie_id: str):
    """Get movie details"""
    if movie_id not in MOCK_MOVIES:
        raise HTTPException(status_code=404, detail="Movie not found")
    movie = MOCK_MOVIES[movie_id]
    return movie.model_dump()

# ============== HISTORY & FAVORITES ==============

@api_router.get("/history")
async def get_history(request: Request):
    """Get search history"""
    user = await require_auth(request)
    history = await db.search_history.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    return history

@api_router.delete("/history")
async def clear_history(request: Request):
    """Clear search history"""
    user = await require_auth(request)
    await db.search_history.delete_many({"user_id": user.user_id})
    return {"message": "History cleared"}

@api_router.get("/favorites")
async def get_favorites(request: Request):
    """Get favorites"""
    user = await require_auth(request)
    favorites = await db.favorites.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return favorites

@api_router.post("/favorites")
async def add_favorite(request: Request):
    """Add movie to favorites"""
    user = await require_auth(request)
    body = await request.json()
    movie_id = body.get("movie_id")
    
    if movie_id not in MOCK_MOVIES:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    movie = MOCK_MOVIES[movie_id]
    
    existing = await db.favorites.find_one(
        {"user_id": user.user_id, "movie_id": movie_id},
        {"_id": 0}
    )
    if existing:
        return existing
    
    favorite = {
        "id": str(uuid.uuid4()),
        "user_id": user.user_id,
        "movie_id": movie_id,
        "movie_title": movie.title_ru or movie.title,
        "movie_poster": movie.poster,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.favorites.insert_one(favorite)
    if "_id" in favorite:
        del favorite["_id"]
    return favorite

@api_router.delete("/favorites/{movie_id}")
async def remove_favorite(movie_id: str, request: Request):
    """Remove movie from favorites"""
    user = await require_auth(request)
    await db.favorites.delete_one({"user_id": user.user_id, "movie_id": movie_id})
    return {"message": "Removed from favorites"}

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "StarMaps API", "version": "2.0.0", "movies_count": len(MOCK_MOVIES)}

# Include the router
app.include_router(api_router)

# CORS
frontend_url = os.environ.get('FRONTEND_URL', 'https://film-search.preview.emergentagent.com')
allowed_origins = [
    frontend_url,
    "http://localhost:3000",
    "https://localhost:3000",
    "https://film-search.preview.emergentagent.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
