from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MovieNode(BaseModel):
    id: str
    title: str
    title_ru: Optional[str] = None
    year: int
    poster: Optional[str] = None
    vibe: str
    is_top: bool = False
    x: Optional[float] = None
    y: Optional[float] = None

class MovieLink(BaseModel):
    source: str
    target: str
    strength: float = 0.5

class MovieDetail(BaseModel):
    id: str
    title: str
    title_ru: Optional[str] = None
    year: int
    poster: Optional[str] = None
    backdrop: Optional[str] = None
    description: str
    description_ru: Optional[str] = None
    why_recommended: List[str]
    rating: float
    reviews: List[Dict[str, Any]]
    watch_providers: List[Dict[str, str]]

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

class SearchHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    query: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FavoriteMovie(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    movie_id: str
    movie_title: str
    movie_poster: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MagicLinkRequest(BaseModel):
    email: str

# ============== MOCK DATA ==============

MOCK_MOVIES = {
    "arrival": MovieDetail(
        id="arrival",
        title="Arrival",
        title_ru="Прибытие",
        year=2016,
        poster="https://m.media-amazon.com/images/M/MV5BMTExMzU0ODcxNDheQTJeQWpwZ15BbWU4MDE1OTI4MzAy._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200",
        description="A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
        description_ru="Лингвист работает с военными, чтобы установить контакт с инопланетными формами жизни после появления двенадцати загадочных космических кораблей по всему миру.",
        why_recommended=[
            "Философская sci-fi без космоса",
            "Темп медленнее, чем в Интерстелларе",
            "Эмоциональная тишина и масштаб"
        ],
        rating=8.0,
        reviews=[
            {"author": "CinemaFan", "text": "Очень атмосферное и задумчивое кино. По глубине — прям как Интерстеллар.", "rating": 5, "date": "10 марта 2024"},
            {"author": "MovieBuff", "text": "Фильм, который заставляет задуматься о времени и смысле жизни.", "rating": 5, "date": "10 марта 2024"}
        ],
        watch_providers=[
            {"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"},
            {"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}
        ]
    ),
    "blade_runner_2049": MovieDetail(
        id="blade_runner_2049",
        title="Blade Runner 2049",
        title_ru="Бегущий по лезвию 2049",
        year=2017,
        poster="https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.",
        description_ru="Открытие давно погребённой тайны молодым бегущим по лезвию К приводит его на поиски бывшего бегущего Рика Декарда.",
        why_recommended=[
            "Визуально потрясающий неонуар",
            "Медитативный темп, как вы просили",
            "Глубокие вопросы о человечности"
        ],
        rating=8.0,
        reviews=[
            {"author": "NeoNoir", "text": "Визуальный шедевр. Каждый кадр — произведение искусства.", "rating": 5, "date": "15 февраля 2024"}
        ],
        watch_providers=[
            {"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"},
            {"name": "Okko", "url": "https://okko.tv", "icon": "film"}
        ]
    ),
    "drive": MovieDetail(
        id="drive",
        title="Drive",
        title_ru="Драйв",
        year=2011,
        poster="https://m.media-amazon.com/images/M/MV5BZjY5ZjQyMjMtMmEwOC00Nzc2LTllYTItMmU2MzJjNTg1NjY0XkEyXkFqcGdeQXVyNjQ1MTMzMDQ@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="A mysterious Hollywood stuntman and mechanic moonlights as a getaway driver and finds himself in trouble when he helps out his neighbor.",
        description_ru="Таинственный голливудский каскадёр и механик подрабатывает водителем для ограблений и попадает в неприятности, когда решает помочь соседке.",
        why_recommended=[
            "Минималистичный стиль повествования",
            "Тишина важнее диалогов",
            "Неоновая эстетика 80-х"
        ],
        rating=7.8,
        reviews=[
            {"author": "StyleMaster", "text": "Идеальное сочетание стиля и содержания.", "rating": 5, "date": "20 января 2024"}
        ],
        watch_providers=[
            {"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}
        ]
    ),
    "gattaca": MovieDetail(
        id="gattaca",
        title="Gattaca",
        title_ru="Гаттака",
        year=1997,
        poster="https://m.media-amazon.com/images/M/MV5BNDQxOTc0MzMtZmRlOS00OWQ5LWI2ZDctOTAwNmMwMmQ0NTdmXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
        description="A genetically inferior man assumes the identity of a superior one in order to pursue his lifelong dream of space travel.",
        description_ru="Генетически неполноценный человек принимает личность превосходящего его, чтобы осуществить свою мечту о космических путешествиях.",
        why_recommended=[
            "Интеллектуальная sci-fi",
            "О человеческом духе и судьбе",
            "Минимум экшена, максимум смысла"
        ],
        rating=7.8,
        reviews=[
            {"author": "SciFiLover", "text": "Недооценённая классика. Визуально безупречно.", "rating": 5, "date": "5 марта 2024"}
        ],
        watch_providers=[
            {"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}
        ]
    ),
    "memento": MovieDetail(
        id="memento",
        title="Memento",
        title_ru="Помни",
        year=2000,
        poster="https://m.media-amazon.com/images/M/MV5BZTcyNjk1MjgtOWI3Mi00YzQwLWI5MTktMzY4ZmI2NDAyNzYzXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
        description="A man with short-term memory loss attempts to track down his wife's murderer.",
        description_ru="Человек с потерей кратковременной памяти пытается найти убийцу своей жены.",
        why_recommended=[
            "Нелинейное повествование",
            "Психологический триллер",
            "Классика Нолана"
        ],
        rating=8.4,
        reviews=[
            {"author": "PuzzleFan", "text": "Гениальная структура повествования.", "rating": 5, "date": "28 февраля 2024"}
        ],
        watch_providers=[
            {"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}
        ]
    ),
    "prisoners": MovieDetail(
        id="prisoners",
        title="Prisoners",
        title_ru="Пленницы",
        year=2013,
        poster="https://m.media-amazon.com/images/M/MV5BMTg0NTIzMjQ1NV5BMl5BanBnXkFtZTcwNDc3MzM5OQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        description="When Keller Dover's daughter and her friend go missing, he takes matters into his own hands as the police pursue multiple leads.",
        description_ru="Когда дочь Келлера Дувра и её подруга пропадают, он берёт дело в свои руки, пока полиция расследует множество версий.",
        why_recommended=[
            "Напряжённый триллер Вильнёва",
            "Мрачная атмосфера",
            "Моральные дилеммы"
        ],
        rating=8.1,
        reviews=[
            {"author": "ThrillerFan", "text": "Держит в напряжении до последней минуты.", "rating": 5, "date": "12 марта 2024"}
        ],
        watch_providers=[
            {"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}
        ]
    ),
    "her": MovieDetail(
        id="her",
        title="Her",
        title_ru="Она",
        year=2013,
        poster="https://m.media-amazon.com/images/M/MV5BMjA1Nzk0OTM2OF5BMl5BanBnXkFtZTgwNjU2NjEwMDE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
        description="In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need.",
        description_ru="В недалёком будущем одинокий писатель развивает необычные отношения с операционной системой, созданной для удовлетворения всех его потребностей.",
        why_recommended=[
            "Романтическая sci-fi",
            "Исследование одиночества",
            "Тёплые пастельные тона"
        ],
        rating=8.0,
        reviews=[
            {"author": "RomanceFan", "text": "Невероятно трогательный фильм о любви.", "rating": 5, "date": "14 февраля 2024"}
        ],
        watch_providers=[
            {"name": "Okko", "url": "https://okko.tv", "icon": "film"}
        ]
    ),
    "no_country": MovieDetail(
        id="no_country",
        title="No Country for Old Men",
        title_ru="Старикам тут не место",
        year=2007,
        poster="https://m.media-amazon.com/images/M/MV5BMjA5Njk3MjM4OV5BMl5BanBnXkFtZTcwMTc5MTE1MQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande.",
        description_ru="Насилие и хаос следуют за охотником, наткнувшимся на неудачную сделку с наркотиками и более двух миллионов долларов наличными у Рио-Гранде.",
        why_recommended=[
            "Неумолимое напряжение",
            "Философия зла",
            "Минимум музыки, максимум тишины"
        ],
        rating=8.2,
        reviews=[
            {"author": "CoenFan", "text": "Шедевр братьев Коэн.", "rating": 5, "date": "8 марта 2024"}
        ],
        watch_providers=[
            {"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}
        ]
    ),
    "2001": MovieDetail(
        id="2001",
        title="2001: A Space Odyssey",
        title_ru="Космическая одиссея 2001 года",
        year=1968,
        poster="https://m.media-amazon.com/images/M/MV5BMmNlYzRiNDctZWNhMi00MzI4LThkZTctMTUzMmZkMmFmNThmXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200",
        description="After discovering a mysterious artifact buried beneath the Lunar surface, mankind sets off on a quest to find its origins with help from intelligent supercomputer H.A.L. 9000.",
        description_ru="После обнаружения загадочного артефакта, погребённого под лунной поверхностью, человечество отправляется на поиски его происхождения с помощью разумного суперкомпьютера HAL 9000.",
        why_recommended=[
            "Визионерская классика Кубрика",
            "Медитативный космос",
            "Визуальная поэзия"
        ],
        rating=8.3,
        reviews=[
            {"author": "ClassicFan", "text": "Вечная классика, которая не стареет.", "rating": 5, "date": "1 января 2024"}
        ],
        watch_providers=[
            {"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}
        ]
    ),
    "ex_machina": MovieDetail(
        id="ex_machina",
        title="Ex Machina",
        title_ru="Из машины",
        year=2014,
        poster="https://m.media-amazon.com/images/M/MV5BMTUxNzc0OTIxMV5BMl5BanBnXkFtZTgwNDI3NzU2NDE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200",
        description="A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a highly advanced humanoid A.I.",
        description_ru="Молодой программист выбран для участия в новаторском эксперименте по оценке человеческих качеств высокоразвитого гуманоидного ИИ.",
        why_recommended=[
            "Камерная sci-fi",
            "Вопросы сознания и ИИ",
            "Визуальный минимализм"
        ],
        rating=7.7,
        reviews=[
            {"author": "AIFan", "text": "Умный и красивый фильм об ИИ.", "rating": 5, "date": "20 марта 2024"}
        ],
        watch_providers=[
            {"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}
        ]
    ),
    "interstellar": MovieDetail(
        id="interstellar",
        title="Interstellar",
        title_ru="Интерстеллар",
        year=2014,
        poster="https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=1200",
        description="A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        description_ru="Группа исследователей путешествует через червоточину в космосе, пытаясь обеспечить выживание человечества.",
        why_recommended=["Эпическая космическая одиссея", "Эмоциональная глубина", "Научная фантастика высшего класса"],
        rating=8.6,
        reviews=[{"author": "SpaceFan", "text": "Шедевр Нолана о любви и времени.", "rating": 5, "date": "15 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "matrix": MovieDetail(
        id="matrix",
        title="The Matrix",
        title_ru="Матрица",
        year=1999,
        poster="https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200",
        description="A computer hacker learns about the true nature of reality and his role in the war against its controllers.",
        description_ru="Компьютерный хакер узнаёт об истинной природе реальности и своей роли в войне против её контролёров.",
        why_recommended=["Революционный киберпанк", "Философские вопросы реальности", "Культовый экшен"],
        rating=8.7,
        reviews=[{"author": "NeoFan", "text": "Фильм, изменивший кинематограф.", "rating": 5, "date": "1 января 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "inception": MovieDetail(
        id="inception",
        title="Inception",
        title_ru="Начало",
        year=2010,
        poster="https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        description="A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.",
        description_ru="Вор, который крадёт корпоративные секреты через технологию совместных сновидений, получает задание внедрить идею.",
        why_recommended=["Многослойный сюжет", "Визуальное великолепие", "Исследование подсознания"],
        rating=8.8,
        reviews=[{"author": "DreamFan", "text": "Гениальная головоломка Нолана.", "rating": 5, "date": "20 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "eternal_sunshine": MovieDetail(
        id="eternal_sunshine",
        title="Eternal Sunshine of the Spotless Mind",
        title_ru="Вечное сияние чистого разума",
        year=2004,
        poster="https://m.media-amazon.com/images/M/MV5BMTY4NzcwODg3Nl5BMl5BanBnXkFtZTcwNTEwOTMyMw@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200",
        description="When their relationship turns sour, a couple undergoes a procedure to have each other erased from their memories.",
        description_ru="Когда их отношения портятся, пара проходит процедуру стирания воспоминаний друг о друге.",
        why_recommended=["Уникальная история любви", "Исследование памяти", "Эмоциональная глубина"],
        rating=8.3,
        reviews=[{"author": "RomanceFan", "text": "Самый необычный фильм о любви.", "rating": 5, "date": "14 февраля 2024"}],
        watch_providers=[{"name": "Okko", "url": "https://okko.tv", "icon": "film"}]
    ),
    "moon": MovieDetail(
        id="moon",
        title="Moon",
        title_ru="Луна 2112",
        year=2009,
        poster="https://m.media-amazon.com/images/M/MV5BMTgzODgyNTQwOV5BMl5BanBnXkFtZTcwNzc0NTc0Mg@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200",
        description="Astronaut Sam Bell has a quintessentially personal encounter toward the end of his three-year stint on the Moon.",
        description_ru="Астронавт Сэм Белл переживает глубоко личный опыт к концу своего трёхлетнего пребывания на Луне.",
        why_recommended=["Камерная sci-fi", "Философские вопросы идентичности", "Минималистичный стиль"],
        rating=7.9,
        reviews=[{"author": "SciFiFan", "text": "Недооценённая жемчужина sci-fi.", "rating": 5, "date": "10 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "solaris": MovieDetail(
        id="solaris",
        title="Solaris",
        title_ru="Солярис",
        year=1972,
        poster="https://m.media-amazon.com/images/M/MV5BZmY4Yjc0OWQtZDRhMy00ODc2LWI2ZGYtMmNlZTYzZTkxZjRjXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
        description="A psychologist is sent to a station orbiting a distant planet to discover what has caused the crew to go insane.",
        description_ru="Психолог отправлен на станцию, орбитирующую вокруг далёкой планеты, чтобы выяснить, что свело команду с ума.",
        why_recommended=["Философская классика Тарковского", "Медитативный темп", "Исследование сознания"],
        rating=8.1,
        reviews=[{"author": "ClassicFan", "text": "Тарковский в своём лучшем проявлении.", "rating": 5, "date": "5 января 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "stalker": MovieDetail(
        id="stalker",
        title="Stalker",
        title_ru="Сталкер",
        year=1979,
        poster="https://m.media-amazon.com/images/M/MV5BMDgwODNmMGItMDcwYi00OWZjLTgyZjAtMGYwMmI4N2Q0NmJmXkEyXkFqcGdeQXVyNzY1MTU0Njk@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="A guide leads two men through an area known as the Zone to find a room that grants wishes.",
        description_ru="Проводник ведёт двух мужчин через область, известную как Зона, чтобы найти комнату, исполняющую желания.",
        why_recommended=["Медитативное кино", "Философские размышления", "Уникальная атмосфера"],
        rating=8.2,
        reviews=[{"author": "ArtFan", "text": "Кино как искусство в чистом виде.", "rating": 5, "date": "1 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "prestige": MovieDetail(
        id="prestige",
        title="The Prestige",
        title_ru="Престиж",
        year=2006,
        poster="https://m.media-amazon.com/images/M/MV5BMjA4NDI0MTIxNF5BMl5BanBnXkFtZTYwNTM0MzY2._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
        description="Two stage magicians engage in competitive one-upmanship in an attempt to create the ultimate stage illusion.",
        description_ru="Два сценических фокусника соревнуются друг с другом, пытаясь создать идеальную иллюзию.",
        why_recommended=["Загадочный сюжет", "Неожиданные повороты", "Мастерство Нолана"],
        rating=8.5,
        reviews=[{"author": "MysteryFan", "text": "Фильм, который хочется пересматривать.", "rating": 5, "date": "25 февраля 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "shutter_island": MovieDetail(
        id="shutter_island",
        title="Shutter Island",
        title_ru="Остров проклятых",
        year=2010,
        poster="https://m.media-amazon.com/images/M/MV5BYzhiNDkyNzktNTZmYS00ZTBkLTk2MDAtM2U0YjU1MzgxZjgzXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="A U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane.",
        description_ru="Маршал США расследует исчезновение убийцы, сбежавшей из психиатрической больницы.",
        why_recommended=["Психологический триллер", "Атмосфера тайны", "Неожиданная развязка"],
        rating=8.2,
        reviews=[{"author": "ThrillerFan", "text": "Держит в напряжении до конца.", "rating": 5, "date": "15 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "fight_club": MovieDetail(
        id="fight_club",
        title="Fight Club",
        title_ru="Бойцовский клуб",
        year=1999,
        poster="https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="An insomniac office worker and a devil-may-care soap maker form an underground fight club.",
        description_ru="Страдающий бессонницей офисный работник и беззаботный мыловар создают подпольный бойцовский клуб.",
        why_recommended=["Культовый статус", "Социальная критика", "Незабываемый твист"],
        rating=8.8,
        reviews=[{"author": "CultFan", "text": "Фильм, определивший поколение.", "rating": 5, "date": "1 января 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "silence_lambs": MovieDetail(
        id="silence_lambs",
        title="The Silence of the Lambs",
        title_ru="Молчание ягнят",
        year=1991,
        poster="https://m.media-amazon.com/images/M/MV5BNjNhZTk0ZmEtNjJhMi00YzFlLWE1MmEtYzM1M2ZmMGMwMTU4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
        description="A young FBI cadet must receive the help of an incarcerated cannibal killer to help catch another serial killer.",
        description_ru="Молодой кадет ФБР должна получить помощь заключённого каннибала, чтобы поймать другого серийного убийцу.",
        why_recommended=["Эталонный триллер", "Культовые персонажи", "Напряжённая атмосфера"],
        rating=8.6,
        reviews=[{"author": "HorrorFan", "text": "Один из лучших триллеров в истории.", "rating": 5, "date": "20 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "seven": MovieDetail(
        id="seven",
        title="Se7en",
        title_ru="Семь",
        year=1995,
        poster="https://m.media-amazon.com/images/M/MV5BOTUwODM5MTctZjczMi00OTk4LTg3NWUtNmVhMTAzNTNjYjcyXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        description="Two detectives hunt a serial killer who uses the seven deadly sins as his motives.",
        description_ru="Два детектива охотятся на серийного убийцу, использующего семь смертных грехов как мотивы.",
        why_recommended=["Мрачный детектив", "Незабываемый финал", "Стиль Финчера"],
        rating=8.6,
        reviews=[{"author": "NoirFan", "text": "Мрачный шедевр 90-х.", "rating": 5, "date": "10 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "gone_girl": MovieDetail(
        id="gone_girl",
        title="Gone Girl",
        title_ru="Исчезнувшая",
        year=2014,
        poster="https://m.media-amazon.com/images/M/MV5BMTk0MDQ3MzAzOV5BMl5BanBnXkFtZTgwNzU1NzE3MjE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
        description="A man becomes the main suspect after his wife goes missing on their anniversary.",
        description_ru="Мужчина становится главным подозреваемым после исчезновения жены в день их годовщины.",
        why_recommended=["Напряжённый триллер", "Неожиданные повороты", "Блестящая игра актёров"],
        rating=8.1,
        reviews=[{"author": "ThrillerFan", "text": "Финчер снова в ударе.", "rating": 5, "date": "5 марта 2024"}],
        watch_providers=[{"name": "Okko", "url": "https://okko.tv", "icon": "film"}]
    ),
    "zodiac": MovieDetail(
        id="zodiac",
        title="Zodiac",
        title_ru="Зодиак",
        year=2007,
        poster="https://m.media-amazon.com/images/M/MV5BN2UwNDc5NmEtNjVjZS00OTI5LWE5YjctMWM3ZjBiZGE0OWI0XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="A cartoonist becomes obsessed with tracking down the Zodiac Killer.",
        description_ru="Карикатурист становится одержим поиском убийцы Зодиака.",
        why_recommended=["Реальная история", "Атмосфера 70-х", "Детективное расследование"],
        rating=7.7,
        reviews=[{"author": "TrueCrimeFan", "text": "Захватывающая история одержимости.", "rating": 4, "date": "15 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "sicario": MovieDetail(
        id="sicario",
        title="Sicario",
        title_ru="Убийца",
        year=2015,
        poster="https://m.media-amazon.com/images/M/MV5BMjA5NjM3NTk1M15BMl5BanBnXkFtZTgwMzg1MzU2NjE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="An FBI agent is enlisted to help take down a Mexican drug cartel leader.",
        description_ru="Агент ФБР привлечён для помощи в уничтожении мексиканского наркокартеля.",
        why_recommended=["Напряжённый экшен", "Моральная неоднозначность", "Стиль Вильнёва"],
        rating=7.6,
        reviews=[{"author": "ActionFan", "text": "Вильнёв создал шедевр напряжения.", "rating": 5, "date": "1 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "annihilation": MovieDetail(
        id="annihilation",
        title="Annihilation",
        title_ru="Аннигиляция",
        year=2018,
        poster="https://m.media-amazon.com/images/M/MV5BMTk2Mjc2NzYxNl5BMl5BanBnXkFtZTgwMTA2OTA1NDM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
        description="A biologist signs up for a dangerous secret expedition into a mysterious zone.",
        description_ru="Биолог записывается в опасную секретную экспедицию в загадочную зону.",
        why_recommended=["Визуально потрясающий", "Sci-fi хоррор", "Философские темы"],
        rating=6.8,
        reviews=[{"author": "SciFiFan", "text": "Уникальный визуальный опыт.", "rating": 4, "date": "20 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "donnie_darko": MovieDetail(
        id="donnie_darko",
        title="Donnie Darko",
        title_ru="Донни Дарко",
        year=2001,
        poster="https://m.media-amazon.com/images/M/MV5BZjZlZDlkYTktMmU1My00ZDBiLWFlNjEtYTBhNjVhOTM4ZjJjXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200",
        description="A troubled teenager is plagued by visions of a man in a large rabbit suit.",
        description_ru="Проблемного подростка преследуют видения человека в костюме кролика.",
        why_recommended=["Культовая мистика", "Сюрреалистичный сюжет", "Атмосфера 80-х"],
        rating=8.0,
        reviews=[{"author": "CultFan", "text": "Загадочный шедевр.", "rating": 5, "date": "10 февраля 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "mulholland_drive": MovieDetail(
        id="mulholland_drive",
        title="Mulholland Drive",
        title_ru="Малхолланд Драйв",
        year=2001,
        poster="https://m.media-amazon.com/images/M/MV5BYWFiYmQzYTItNDc5OC00NDUwLTkyMWItMWY5NmVkZDUwMjYyXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="After a car wreck on Mulholland Drive, an amnesiac woman pieces together her identity with help from a aspiring actress.",
        description_ru="После аварии на Малхолланд Драйв женщина с амнезией пытается восстановить свою личность с помощью начинающей актрисы.",
        why_recommended=["Линчевский сюрреализм", "Загадочный нуар", "Многослойный сюжет"],
        rating=7.9,
        reviews=[{"author": "LynchFan", "text": "Линч в своей стихии.", "rating": 5, "date": "5 января 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    )
}

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
    """Require authentication - raises 401 if not authenticated"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Process session_id from Emergent Auth and create session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    auth_data = auth_response.json()
    
    # Create or update user
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
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
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
    """Send magic link email (mock for demo)"""
    # In production, this would send an actual email
    # For demo, we'll create a direct session
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
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create magic token (in production, this would be sent via email)
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
    """Verify magic link token and create session"""
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
    
    # Delete used token
    await db.magic_links.delete_one({"token": token})
    
    # Create session
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
        # Parse JSON from response
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        result = json.loads(response_text)
        return QueryValidation(**result)
    except Exception as e:
        logger.error(f"AI validation error: {e}")
        # Fallback validation
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

async def get_movie_recommendations(query: str) -> GraphResponse:
    """Get movie recommendations using GPT-5.2"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"recommend_{uuid.uuid4().hex[:8]}",
        system_message="""Ты - эксперт по кино, который подбирает фильмы под настроение пользователя.

На основе запроса пользователя, выбери 20-25 фильмов из этого списка и объясни связи между ними:
- Arrival (Прибытие, 2016) - философская sci-fi
- Blade Runner 2049 (Бегущий по лезвию 2049, 2017) - неонуар
- Drive (Драйв, 2011) - минималистичный криминал  
- Gattaca (Гаттака, 1997) - интеллектуальная sci-fi
- Memento (Помни, 2000) - психологический триллер
- Prisoners (Пленницы, 2013) - мрачный триллер
- Her (Она, 2013) - романтическая sci-fi
- No Country for Old Men (Старикам тут не место, 2007) - криминальная драма
- 2001: A Space Odyssey (Космическая одиссея 2001, 1968) - классика
- Ex Machina (Из машины, 2014) - камерная sci-fi
- Interstellar (Интерстеллар, 2014) - эпическая sci-fi
- The Matrix (Матрица, 1999) - киберпанк
- Inception (Начало, 2010) - сны и реальность
- Eternal Sunshine (Вечное сияние чистого разума, 2004) - романтика и память
- Moon (Луна 2112, 2009) - камерная sci-fi
- Solaris (Солярис, 1972) - философская классика
- Stalker (Сталкер, 1979) - медитативное кино
- The Prestige (Престиж, 2006) - загадочный триллер
- Shutter Island (Остров проклятых, 2010) - психологический триллер
- Fight Club (Бойцовский клуб, 1999) - культовая драма
- The Silence of the Lambs (Молчание ягнят, 1991) - криминальный триллер
- Se7en (Семь, 1995) - мрачный детектив
- Gone Girl (Исчезнувшая, 2014) - триллер
- Zodiac (Зодиак, 2007) - криминальная драма
- Sicario (Убийца, 2015) - напряжённый боевик
- Annihilation (Аннигиляция, 2018) - sci-fi хоррор
- Arrival (Контакт, 1997) - sci-fi драма
- The Fountain (Фонтан, 2006) - философская драма
- Donnie Darko (Донни Дарко, 2001) - культовая мистика
- Mulholland Drive (Малхолланд Драйв, 2001) - загадочный нуар

Выбери 4-5 TOP фильмов (is_top: true), которые ЛУЧШЕ ВСЕГО подходят под запрос.
Остальные 15-20 - связанные по теме/настроению (is_top: false).

Отвечай СТРОГО в формате JSON:
{
    "nodes": [
        {"id": "arrival", "title": "Arrival", "title_ru": "Прибытие", "year": 2016, "vibe": "философская тишина", "is_top": true},
        ...
    ],
    "links": [
        {"source": "arrival", "target": "her", "strength": 0.7},
        ...
    ],
    "query_summary": "Краткое описание того, что подобрано (1-2 предложения)"
}

ID фильмов: arrival, blade_runner_2049, drive, gattaca, memento, prisoners, her, no_country, 2001, ex_machina"""
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
        # Fallback response
        return GraphResponse(
            nodes=[
                MovieNode(id="arrival", title="Arrival", title_ru="Прибытие", year=2016, vibe="философская тишина", is_top=True, poster=MOCK_MOVIES["arrival"].poster),
                MovieNode(id="blade_runner_2049", title="Blade Runner 2049", title_ru="Бегущий по лезвию 2049", year=2017, vibe="неонуар", is_top=True, poster=MOCK_MOVIES["blade_runner_2049"].poster),
                MovieNode(id="drive", title="Drive", title_ru="Драйв", year=2011, vibe="минимализм", is_top=True, poster=MOCK_MOVIES["drive"].poster),
                MovieNode(id="gattaca", title="Gattaca", title_ru="Гаттака", year=1997, vibe="интеллектуальная", is_top=True, poster=MOCK_MOVIES["gattaca"].poster),
                MovieNode(id="memento", title="Memento", title_ru="Помни", year=2000, vibe="психологический", is_top=False, poster=MOCK_MOVIES["memento"].poster),
                MovieNode(id="prisoners", title="Prisoners", title_ru="Пленницы", year=2013, vibe="мрачный", is_top=False, poster=MOCK_MOVIES["prisoners"].poster),
                MovieNode(id="her", title="Her", title_ru="Она", year=2013, vibe="романтический", is_top=False, poster=MOCK_MOVIES["her"].poster),
                MovieNode(id="no_country", title="No Country for Old Men", title_ru="Старикам тут не место", year=2007, vibe="напряжённый", is_top=False, poster=MOCK_MOVIES["no_country"].poster),
            ],
            links=[
                MovieLink(source="arrival", target="her", strength=0.7),
                MovieLink(source="arrival", target="gattaca", strength=0.8),
                MovieLink(source="blade_runner_2049", target="drive", strength=0.6),
                MovieLink(source="blade_runner_2049", target="gattaca", strength=0.7),
                MovieLink(source="drive", target="no_country", strength=0.5),
                MovieLink(source="memento", target="prisoners", strength=0.6),
                MovieLink(source="gattaca", target="ex_machina", strength=0.8),
                MovieLink(source="her", target="ex_machina", strength=0.7),
            ],
            query_summary="Подобрано медленное, философское кино с атмосферой Интерстеллара, но без космоса."
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
    
    # Save to history if user is logged in
    if user:
        await db.search_history.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user.user_id,
            "query": data.query,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return await get_movie_recommendations(data.query)

@api_router.get("/movies/{movie_id}", response_model=MovieDetail)
async def get_movie_detail(movie_id: str):
    """Get movie details"""
    if movie_id not in MOCK_MOVIES:
        raise HTTPException(status_code=404, detail="Movie not found")
    return MOCK_MOVIES[movie_id]

# ============== HISTORY & FAVORITES ==============

@api_router.get("/history")
async def get_history(request: Request):
    """Get search history for current user"""
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
    """Get favorites for current user"""
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
    
    # Check if already favorited
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
    return {"message": "CineStarMaps API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
