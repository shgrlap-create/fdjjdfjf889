from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
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

from movies_data import MOCK_MOVIES, ALL_MOVIE_IDS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    avatar: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    onboarding_completed: bool = False
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

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

class OnboardingData(BaseModel):
    favorite_genre: str
    favorite_mood: str
    favorite_era: str
    favorite_character: Optional[str] = None

class AvatarGenerateRequest(BaseModel):
    style_prompt: Optional[str] = None

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
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
            {"$set": {"name": auth_data.get("name", ""), "picture": auth_data.get("picture", "")}}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data.get("name", ""),
            "picture": auth_data.get("picture", ""),
            "avatar": None,
            "preferences": None,
            "onboarding_completed": False,
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
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.post("/auth/demo")
async def demo_login(response: Response):
    """Create demo user session without OAuth"""
    demo_id = f"demo_{uuid.uuid4().hex[:8]}"
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    await db.users.insert_one({
        "user_id": user_id,
        "email": f"{demo_id}@demo.starmaps.local",
        "name": "Гость",
        "picture": None,
        "avatar": None,
        "preferences": None,
        "onboarding_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=1)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=24*60*60)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ============== ONBOARDING ==============

@api_router.post("/onboarding")
async def save_onboarding(data: OnboardingData, request: Request):
    """Save user preferences from onboarding"""
    user = await require_auth(request)
    
    preferences = {
        "favorite_genre": data.favorite_genre,
        "favorite_mood": data.favorite_mood,
        "favorite_era": data.favorite_era,
        "favorite_character": data.favorite_character
    }
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"preferences": preferences, "onboarding_completed": True}}
    )
    
    # Generate personalized compliment
    compliment = await generate_compliment(preferences)
    
    return {"message": "Preferences saved", "compliment": compliment}

async def generate_compliment(preferences: dict) -> str:
    """Generate a personalized compliment based on preferences"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"compliment_{uuid.uuid4().hex[:8]}",
            system_message="Ты - дружелюбный киноэксперт. Сгенерируй короткий (1-2 предложения) тёплый и приятный комплимент пользователю на основе его вкусов в кино. Будь искренним и позитивным."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"Пользователь любит: жанр - {preferences['favorite_genre']}, настроение - {preferences['favorite_mood']}, эпоха - {preferences['favorite_era']}. Сгенерируй комплимент."
        response = await chat.send_message(UserMessage(text=prompt))
        return response.strip()
    except Exception as e:
        logger.error(f"Compliment generation error: {e}")
        return "У вас отличный вкус в кино! Мы подберём для вас идеальные фильмы."

# ============== AI AVATAR ==============

@api_router.post("/profile/generate-avatar")
async def generate_avatar(data: AvatarGenerateRequest, request: Request):
    """Generate AI avatar based on user preferences"""
    user = await require_auth(request)
    
    preferences = user.preferences or {}
    
    # Build prompt based on preferences
    genre = preferences.get("favorite_genre", "драма")
    mood = preferences.get("favorite_mood", "атмосферный")
    character = preferences.get("favorite_character", "загадочный герой")
    
    prompt = f"Professional cinematic portrait of a person as a {character} character from a {genre} film. {mood} lighting, movie poster style, dramatic composition, high quality, elegant."
    
    if data.style_prompt:
        prompt = data.style_prompt
    
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(prompt=prompt, model="gpt-image-1", number_of_images=1)
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            avatar_data = f"data:image/png;base64,{image_base64}"
            
            await db.users.update_one({"user_id": user.user_id}, {"$set": {"avatar": avatar_data}})
            
            return {"avatar": avatar_data}
        else:
            raise HTTPException(status_code=500, detail="No image generated")
    except Exception as e:
        logger.error(f"Avatar generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, request: Request):
    user = await require_auth(request)
    
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.avatar is not None:
        update_data["avatar"] = data.avatar
    
    if update_data:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return user_doc

# ============== AI MOVIE RECOMMENDATIONS ==============

ALL_MOVIES_STR = """- arrival (Прибытие, 2016) - философская sci-fi
- blade_runner_2049 (Бегущий по лезвию 2049, 2017) - неонуар
- interstellar (Интерстеллар, 2014) - эпическая sci-fi
- matrix (Матрица, 1999) - киберпанк
- inception (Начало, 2010) - сны
- ex_machina (Из машины, 2014) - камерная sci-fi
- her (Она, 2013) - романтическая sci-fi
- dune (Дюна, 2021) - эпическая фантастика
- drive (Драйв, 2011) - минималистичный криминал
- memento (Помни, 2000) - психологический триллер
- prisoners (Пленницы, 2013) - мрачный триллер
- no_country (Старикам тут не место, 2007) - криминальная драма
- prestige (Престиж, 2006) - загадочный триллер
- shutter_island (Остров проклятых, 2010) - психологический триллер
- seven (Семь, 1995) - мрачный детектив
- gone_girl (Исчезнувшая, 2014) - триллер
- sicario (Убийца, 2015) - напряжённый боевик
- nightcrawler (Стрингер, 2014) - тёмная драма
- fight_club (Бойцовский клуб, 1999) - культовая драма
- whiplash (Одержимость, 2014) - напряжённая драма
- eternal_sunshine (Вечное сияние, 2004) - романтика и память
- there_will_be_blood (Нефть, 2007) - эпическая драма
- dark_knight (Тёмный рыцарь, 2008) - супергеройский эпик
- pulp_fiction (Криминальное чтиво, 1994) - культовая классика
- goodfellas (Славные парни, 1990) - гангстерская классика
- parasite (Паразиты, 2019) - социальная сатира
- joker (Джокер, 2019) - характерная драма
- oppenheimer (Оппенгеймер, 2023) - эпическая биография"""

async def get_movie_recommendations(query: str) -> GraphResponse:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"recommend_{uuid.uuid4().hex[:8]}",
        system_message=f"""Ты - эксперт по кино. На основе запроса выбери 15-20 фильмов из списка:
{ALL_MOVIES_STR}

Выбери 4-5 TOP фильмов (is_top: true), остальные 10-15 - связанные (is_top: false).

Отвечай СТРОГО в JSON:
{{"nodes": [{{"id": "arrival", "title": "Arrival", "title_ru": "Прибытие", "year": 2016, "vibe": "философская тишина", "is_top": true}}], "links": [{{"source": "arrival", "target": "her", "strength": 0.7}}], "query_summary": "Краткое описание"}}

Создай 25-35 связей между фильмами."""
    ).with_model("openai", "gpt-5.2")
    
    try:
        response = await chat.send_message(UserMessage(text=query))
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        result = json.loads(response_text)
        
        for node in result["nodes"]:
            if node["id"] in MOCK_MOVIES:
                node["poster"] = MOCK_MOVIES[node["id"]].poster
        
        return GraphResponse(**result)
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        # Fast fallback
        return GraphResponse(
            nodes=[
                MovieNode(id="interstellar", title="Interstellar", title_ru="Интерстеллар", year=2014, vibe="эпос", is_top=True, poster=MOCK_MOVIES["interstellar"].poster),
                MovieNode(id="inception", title="Inception", title_ru="Начало", year=2010, vibe="сны", is_top=True, poster=MOCK_MOVIES["inception"].poster),
                MovieNode(id="dark_knight", title="The Dark Knight", title_ru="Тёмный рыцарь", year=2008, vibe="драма", is_top=True, poster=MOCK_MOVIES["dark_knight"].poster),
                MovieNode(id="arrival", title="Arrival", title_ru="Прибытие", year=2016, vibe="философия", is_top=True, poster=MOCK_MOVIES["arrival"].poster),
                MovieNode(id="blade_runner_2049", title="Blade Runner 2049", title_ru="Бегущий по лезвию", year=2017, vibe="неонуар", is_top=False, poster=MOCK_MOVIES["blade_runner_2049"].poster),
                MovieNode(id="matrix", title="Matrix", title_ru="Матрица", year=1999, vibe="киберпанк", is_top=False, poster=MOCK_MOVIES["matrix"].poster),
                MovieNode(id="prestige", title="The Prestige", title_ru="Престиж", year=2006, vibe="загадка", is_top=False, poster=MOCK_MOVIES["prestige"].poster),
                MovieNode(id="memento", title="Memento", title_ru="Помни", year=2000, vibe="триллер", is_top=False, poster=MOCK_MOVIES["memento"].poster),
                MovieNode(id="fight_club", title="Fight Club", title_ru="Бойцовский клуб", year=1999, vibe="культ", is_top=False, poster=MOCK_MOVIES["fight_club"].poster),
                MovieNode(id="pulp_fiction", title="Pulp Fiction", title_ru="Криминальное чтиво", year=1994, vibe="классика", is_top=False, poster=MOCK_MOVIES["pulp_fiction"].poster),
            ],
            links=[
                MovieLink(source="interstellar", target="inception", strength=0.9),
                MovieLink(source="interstellar", target="arrival", strength=0.8),
                MovieLink(source="inception", target="prestige", strength=0.85),
                MovieLink(source="inception", target="memento", strength=0.8),
                MovieLink(source="dark_knight", target="prestige", strength=0.7),
                MovieLink(source="arrival", target="blade_runner_2049", strength=0.75),
                MovieLink(source="matrix", target="inception", strength=0.6),
                MovieLink(source="matrix", target="fight_club", strength=0.5),
                MovieLink(source="fight_club", target="pulp_fiction", strength=0.6),
                MovieLink(source="memento", target="prestige", strength=0.7),
            ],
            query_summary="Подборка интеллектуального кино с глубоким смыслом."
        )

# ============== MOVIE ENDPOINTS ==============

@api_router.post("/movies/validate", response_model=QueryValidation)
async def validate_query(data: QueryRequest):
    if len(data.query.strip()) < 5:
        return QueryValidation(is_valid=False, error_message="Слишком короткий запрос", suggestions=["Как Интерстеллар, но без космоса", "Мрачный триллер"])
    return QueryValidation(is_valid=True)

@api_router.post("/movies/recommend", response_model=GraphResponse)
async def get_recommendations(data: QueryRequest, request: Request):
    user = await get_current_user(request)
    if user:
        await db.search_history.insert_one({"id": str(uuid.uuid4()), "user_id": user.user_id, "query": data.query, "created_at": datetime.now(timezone.utc).isoformat()})
    return await get_movie_recommendations(data.query)

@api_router.get("/movies/{movie_id}")
async def get_movie_detail(movie_id: str):
    if movie_id not in MOCK_MOVIES:
        raise HTTPException(status_code=404, detail="Movie not found")
    return MOCK_MOVIES[movie_id].model_dump()

# ============== HISTORY & FAVORITES ==============

@api_router.get("/history")
async def get_history(request: Request):
    user = await require_auth(request)
    return await db.search_history.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)

@api_router.delete("/history")
async def clear_history(request: Request):
    user = await require_auth(request)
    await db.search_history.delete_many({"user_id": user.user_id})
    return {"message": "History cleared"}

@api_router.get("/favorites")
async def get_favorites(request: Request):
    user = await require_auth(request)
    return await db.favorites.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/favorites")
async def add_favorite(request: Request):
    user = await require_auth(request)
    body = await request.json()
    movie_id = body.get("movie_id")
    
    if movie_id not in MOCK_MOVIES:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    movie = MOCK_MOVIES[movie_id]
    existing = await db.favorites.find_one({"user_id": user.user_id, "movie_id": movie_id}, {"_id": 0})
    if existing:
        return existing
    
    favorite = {"id": str(uuid.uuid4()), "user_id": user.user_id, "movie_id": movie_id, "movie_title": movie.title_ru or movie.title, "movie_poster": movie.poster, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.favorites.insert_one(favorite)
    if "_id" in favorite:
        del favorite["_id"]
    return favorite

@api_router.delete("/favorites/{movie_id}")
async def remove_favorite(movie_id: str, request: Request):
    user = await require_auth(request)
    await db.favorites.delete_one({"user_id": user.user_id, "movie_id": movie_id})
    return {"message": "Removed"}

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "StarMaps API", "version": "2.1.0", "movies_count": len(MOCK_MOVIES)}

app.include_router(api_router)

frontend_url = os.environ.get('FRONTEND_URL', 'https://film-search.preview.emergentagent.com')
allowed_origins = [frontend_url, "http://localhost:3000", "https://localhost:3000", "https://film-search.preview.emergentagent.com"]

app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=allowed_origins, allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
