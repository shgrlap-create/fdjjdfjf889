# Extended movie database - 50 films
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

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

MOCK_MOVIES = {
    # === SCI-FI ===
    "arrival": MovieDetail(
        id="arrival", title="Arrival", title_ru="Прибытие", year=2016,
        poster="https://m.media-amazon.com/images/M/MV5BMTExMzU0ODcxNDheQTJeQWpwZ15BbWU4MDE1OTI4MzAy._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200",
        description="A linguist works with the military to communicate with alien lifeforms.",
        description_ru="Лингвист работает с военными, чтобы установить контакт с инопланетными формами жизни.",
        why_recommended=["Философская sci-fi", "Медитативный темп", "Эмоциональная глубина"],
        rating=8.0, reviews=[{"author": "CinemaFan", "text": "Атмосферное кино", "rating": 5, "date": "10 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "blade_runner_2049": MovieDetail(
        id="blade_runner_2049", title="Blade Runner 2049", title_ru="Бегущий по лезвию 2049", year=2017,
        poster="https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="Young Blade Runner K's discovery leads him to track down former Blade Runner Rick Deckard.",
        description_ru="Открытие тайны молодым К приводит его на поиски Рика Декарда.",
        why_recommended=["Визуальный шедевр", "Неонуар эстетика", "Глубокие вопросы"],
        rating=8.0, reviews=[{"author": "NeoNoir", "text": "Каждый кадр — искусство", "rating": 5, "date": "15 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "interstellar": MovieDetail(
        id="interstellar", title="Interstellar", title_ru="Интерстеллар", year=2014,
        poster="https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=1200",
        description="A team travels through a wormhole to ensure humanity's survival.",
        description_ru="Группа исследователей путешествует через червоточину ради выживания человечества.",
        why_recommended=["Эпическая космическая одиссея", "Эмоциональная глубина", "Научная фантастика"],
        rating=8.6, reviews=[{"author": "SpaceFan", "text": "Шедевр о любви и времени", "rating": 5, "date": "15 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "matrix": MovieDetail(
        id="matrix", title="The Matrix", title_ru="Матрица", year=1999,
        poster="https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200",
        description="A computer hacker learns about the true nature of reality.",
        description_ru="Хакер узнаёт об истинной природе реальности.",
        why_recommended=["Революционный киберпанк", "Философия реальности", "Культовый экшен"],
        rating=8.7, reviews=[{"author": "NeoFan", "text": "Изменил кинематограф", "rating": 5, "date": "1 января 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "inception": MovieDetail(
        id="inception", title="Inception", title_ru="Начало", year=2010,
        poster="https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        description="A thief steals corporate secrets through dream-sharing technology.",
        description_ru="Вор крадёт секреты через технологию совместных сновидений.",
        why_recommended=["Многослойный сюжет", "Визуальное великолепие", "Исследование подсознания"],
        rating=8.8, reviews=[{"author": "DreamFan", "text": "Гениальная головоломка", "rating": 5, "date": "20 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "ex_machina": MovieDetail(
        id="ex_machina", title="Ex Machina", title_ru="Из машины", year=2014,
        poster="https://m.media-amazon.com/images/M/MV5BMTUxNzc0OTIxMV5BMl5BanBnXkFtZTgwNDI3NzU2NDE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200",
        description="A programmer evaluates a humanoid A.I.",
        description_ru="Программист оценивает человеческие качества ИИ.",
        why_recommended=["Камерная sci-fi", "Вопросы сознания", "Визуальный минимализм"],
        rating=7.7, reviews=[{"author": "AIFan", "text": "Умный фильм об ИИ", "rating": 5, "date": "20 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "gattaca": MovieDetail(
        id="gattaca", title="Gattaca", title_ru="Гаттака", year=1997,
        poster="https://m.media-amazon.com/images/M/MV5BNDQxOTc0MzMtZmRlOS00OWQ5LWI2ZDctOTAwNmMwMmQ0NTdmXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
        description="A man assumes another's identity to pursue his dream of space travel.",
        description_ru="Человек принимает чужую личность ради мечты о космосе.",
        why_recommended=["Интеллектуальная sci-fi", "О судьбе и духе", "Минимум экшена"],
        rating=7.8, reviews=[{"author": "SciFiLover", "text": "Недооценённая классика", "rating": 5, "date": "5 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "her": MovieDetail(
        id="her", title="Her", title_ru="Она", year=2013,
        poster="https://m.media-amazon.com/images/M/MV5BMjA1Nzk0OTM2OF5BMl5BanBnXkFtZTgwNjU2NjEwMDE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
        description="A writer develops a relationship with an AI operating system.",
        description_ru="Писатель развивает отношения с операционной системой.",
        why_recommended=["Романтическая sci-fi", "Исследование одиночества", "Тёплые пастельные тона"],
        rating=8.0, reviews=[{"author": "RomanceFan", "text": "Трогательный фильм о любви", "rating": 5, "date": "14 февраля 2024"}],
        watch_providers=[{"name": "Okko", "url": "https://okko.tv", "icon": "film"}]
    ),
    "moon": MovieDetail(
        id="moon", title="Moon", title_ru="Луна 2112", year=2009,
        poster="https://m.media-amazon.com/images/M/MV5BMTgzODgyNTQwOV5BMl5BanBnXkFtZTcwNzc0NTc0Mg@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200",
        description="An astronaut has a personal encounter at the end of his Moon stint.",
        description_ru="Астронавт переживает личный опыт в конце своей миссии на Луне.",
        why_recommended=["Камерная sci-fi", "Вопросы идентичности", "Минималистичный стиль"],
        rating=7.9, reviews=[{"author": "SciFiFan", "text": "Жемчужина sci-fi", "rating": 5, "date": "10 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "solaris": MovieDetail(
        id="solaris", title="Solaris", title_ru="Солярис", year=1972,
        poster="https://m.media-amazon.com/images/M/MV5BZmY4Yjc0OWQtZDRhMy00ODc2LWI2ZGYtMmNlZTYzZTkxZjRjXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
        description="A psychologist is sent to investigate madness at a space station.",
        description_ru="Психолог отправлен исследовать безумие на космической станции.",
        why_recommended=["Философская классика", "Медитативный темп", "Исследование сознания"],
        rating=8.1, reviews=[{"author": "ClassicFan", "text": "Тарковский в лучшем виде", "rating": 5, "date": "5 января 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "stalker": MovieDetail(
        id="stalker", title="Stalker", title_ru="Сталкер", year=1979,
        poster="https://m.media-amazon.com/images/M/MV5BMDgwODNmMGItMDcwYi00OWZjLTgyZjAtMGYwMmI4N2Q0NmJmXkEyXkFqcGdeQXVyNzY1MTU0Njk@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="A guide leads two men through the Zone to find a wish-granting room.",
        description_ru="Проводник ведёт двух мужчин через Зону к комнате желаний.",
        why_recommended=["Медитативное кино", "Философские размышления", "Уникальная атмосфера"],
        rating=8.2, reviews=[{"author": "ArtFan", "text": "Кино как искусство", "rating": 5, "date": "1 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "2001": MovieDetail(
        id="2001", title="2001: A Space Odyssey", title_ru="Космическая одиссея 2001", year=1968,
        poster="https://m.media-amazon.com/images/M/MV5BMmNlYzRiNDctZWNhMi00MzI4LThkZTctMTUzMmZkMmFmNThmXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200",
        description="After discovering an artifact on the Moon, mankind seeks its origins.",
        description_ru="После обнаружения артефакта на Луне человечество ищет его происхождение.",
        why_recommended=["Визионерская классика", "Медитативный космос", "Визуальная поэзия"],
        rating=8.3, reviews=[{"author": "ClassicFan", "text": "Вечная классика", "rating": 5, "date": "1 января 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "eternal_sunshine": MovieDetail(
        id="eternal_sunshine", title="Eternal Sunshine of the Spotless Mind", title_ru="Вечное сияние чистого разума", year=2004,
        poster="https://m.media-amazon.com/images/M/MV5BMTY4NzcwODg3Nl5BMl5BanBnXkFtZTcwNTEwOTMyMw@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200",
        description="A couple undergoes a procedure to erase memories of each other.",
        description_ru="Пара проходит процедуру стирания воспоминаний друг о друге.",
        why_recommended=["Уникальная история любви", "Исследование памяти", "Эмоциональная глубина"],
        rating=8.3, reviews=[{"author": "RomanceFan", "text": "Самый необычный фильм о любви", "rating": 5, "date": "14 февраля 2024"}],
        watch_providers=[{"name": "Okko", "url": "https://okko.tv", "icon": "film"}]
    ),
    "annihilation": MovieDetail(
        id="annihilation", title="Annihilation", title_ru="Аннигиляция", year=2018,
        poster="https://m.media-amazon.com/images/M/MV5BMTk2Mjc2NzYxNl5BMl5BanBnXkFtZTgwMTA2OTA1NDM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
        description="A biologist joins an expedition into a mysterious zone.",
        description_ru="Биолог присоединяется к экспедиции в загадочную зону.",
        why_recommended=["Визуально потрясающий", "Sci-fi хоррор", "Философские темы"],
        rating=6.8, reviews=[{"author": "SciFiFan", "text": "Уникальный опыт", "rating": 4, "date": "20 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "dune": MovieDetail(
        id="dune", title="Dune", title_ru="Дюна", year=2021,
        poster="https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="Paul Atreides must travel to the most dangerous planet in the universe.",
        description_ru="Пол Атрейдес должен отправиться на самую опасную планету во вселенной.",
        why_recommended=["Эпическая фантастика", "Потрясающая визуализация", "Масштабная история"],
        rating=8.0, reviews=[{"author": "EpicFan", "text": "Вильнёв создал шедевр", "rating": 5, "date": "1 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "gravity": MovieDetail(
        id="gravity", title="Gravity", title_ru="Гравитация", year=2013,
        poster="https://m.media-amazon.com/images/M/MV5BNjE5MzYwMzYxMF5BMl5BanBnXkFtZTcwOTk4MTk0OQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200",
        description="Two astronauts struggle to survive after a disaster in space.",
        description_ru="Два астронавта борются за выживание после катастрофы в космосе.",
        why_recommended=["Напряжённый триллер", "Потрясающие визуальные эффекты", "Камерная история"],
        rating=7.7, reviews=[{"author": "SpaceFan", "text": "Невероятное погружение", "rating": 5, "date": "15 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "the_martian": MovieDetail(
        id="the_martian", title="The Martian", title_ru="Марсианин", year=2015,
        poster="https://m.media-amazon.com/images/M/MV5BMTc2MTQ3MDA1Nl5BMl5BanBnXkFtZTgwODA3OTI4NjE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200",
        description="An astronaut must survive alone on Mars after being left behind.",
        description_ru="Астронавт должен выжить на Марсе в одиночку.",
        why_recommended=["Научная фантастика", "Оптимистичная история", "Выживание и наука"],
        rating=8.0, reviews=[{"author": "ScienceFan", "text": "Наука и оптимизм", "rating": 5, "date": "10 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    # === THRILLERS ===
    "drive": MovieDetail(
        id="drive", title="Drive", title_ru="Драйв", year=2011,
        poster="https://m.media-amazon.com/images/M/MV5BZjY5ZjQyMjMtMmEwOC00Nzc2LTllYTItMmU2MzJjNTg1NjY0XkEyXkFqcGdeQXVyNjQ1MTMzMDQ@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="A Hollywood stuntman moonlights as a getaway driver.",
        description_ru="Голливудский каскадёр подрабатывает водителем для ограблений.",
        why_recommended=["Минималистичный стиль", "Тишина важнее диалогов", "Неоновая эстетика"],
        rating=7.8, reviews=[{"author": "StyleMaster", "text": "Идеальное сочетание стиля", "rating": 5, "date": "20 января 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "memento": MovieDetail(
        id="memento", title="Memento", title_ru="Помни", year=2000,
        poster="https://m.media-amazon.com/images/M/MV5BZTcyNjk1MjgtOWI3Mi00YzQwLWI5MTktMzY4ZmI2NDAyNzYzXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
        description="A man with memory loss attempts to track down his wife's murderer.",
        description_ru="Человек с потерей памяти пытается найти убийцу жены.",
        why_recommended=["Нелинейное повествование", "Психологический триллер", "Классика Нолана"],
        rating=8.4, reviews=[{"author": "PuzzleFan", "text": "Гениальная структура", "rating": 5, "date": "28 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "prisoners": MovieDetail(
        id="prisoners", title="Prisoners", title_ru="Пленницы", year=2013,
        poster="https://m.media-amazon.com/images/M/MV5BMTg0NTIzMjQ1NV5BMl5BanBnXkFtZTcwNDc3MzM5OQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        description="A father takes matters into his own hands when his daughter goes missing.",
        description_ru="Отец берёт дело в свои руки когда его дочь пропадает.",
        why_recommended=["Напряжённый триллер", "Мрачная атмосфера", "Моральные дилеммы"],
        rating=8.1, reviews=[{"author": "ThrillerFan", "text": "Держит в напряжении", "rating": 5, "date": "12 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "no_country": MovieDetail(
        id="no_country", title="No Country for Old Men", title_ru="Старикам тут не место", year=2007,
        poster="https://m.media-amazon.com/images/M/MV5BMjA5Njk3MjM4OV5BMl5BanBnXkFtZTcwMTc5MTE1MQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="Violence ensues after a hunter stumbles upon a drug deal gone wrong.",
        description_ru="Насилие следует за охотником, наткнувшимся на неудачную сделку.",
        why_recommended=["Неумолимое напряжение", "Философия зла", "Минимум музыки"],
        rating=8.2, reviews=[{"author": "CoenFan", "text": "Шедевр братьев Коэн", "rating": 5, "date": "8 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "prestige": MovieDetail(
        id="prestige", title="The Prestige", title_ru="Престиж", year=2006,
        poster="https://m.media-amazon.com/images/M/MV5BMjA4NDI0MTIxNF5BMl5BanBnXkFtZTYwNTM0MzY2._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
        description="Two magicians compete to create the ultimate stage illusion.",
        description_ru="Два фокусника соревнуются в создании идеальной иллюзии.",
        why_recommended=["Загадочный сюжет", "Неожиданные повороты", "Мастерство Нолана"],
        rating=8.5, reviews=[{"author": "MysteryFan", "text": "Хочется пересматривать", "rating": 5, "date": "25 февраля 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "shutter_island": MovieDetail(
        id="shutter_island", title="Shutter Island", title_ru="Остров проклятых", year=2010,
        poster="https://m.media-amazon.com/images/M/MV5BYzhiNDkyNzktNTZmYS00ZTBkLTk2MDAtM2U0YjU1MzgxZjgzXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="A U.S. Marshal investigates a disappearance at a psychiatric facility.",
        description_ru="Маршал расследует исчезновение в психиатрической клинике.",
        why_recommended=["Психологический триллер", "Атмосфера тайны", "Неожиданная развязка"],
        rating=8.2, reviews=[{"author": "ThrillerFan", "text": "Держит до конца", "rating": 5, "date": "15 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "fight_club": MovieDetail(
        id="fight_club", title="Fight Club", title_ru="Бойцовский клуб", year=1999,
        poster="https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="An insomniac and a soap maker form an underground fight club.",
        description_ru="Страдающий бессонницей и мыловар создают подпольный бойцовский клуб.",
        why_recommended=["Культовый статус", "Социальная критика", "Незабываемый твист"],
        rating=8.8, reviews=[{"author": "CultFan", "text": "Определил поколение", "rating": 5, "date": "1 января 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "silence_lambs": MovieDetail(
        id="silence_lambs", title="The Silence of the Lambs", title_ru="Молчание ягнят", year=1991,
        poster="https://m.media-amazon.com/images/M/MV5BNjNhZTk0ZmEtNjJhMi00YzFlLWE1MmEtYzM1M2ZmMGMwMTU4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
        description="An FBI trainee seeks help from an imprisoned cannibal to catch a killer.",
        description_ru="Стажёр ФБР ищет помощи у заключённого каннибала для поимки убийцы.",
        why_recommended=["Эталонный триллер", "Культовые персонажи", "Напряжённая атмосфера"],
        rating=8.6, reviews=[{"author": "HorrorFan", "text": "Один из лучших триллеров", "rating": 5, "date": "20 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "seven": MovieDetail(
        id="seven", title="Se7en", title_ru="Семь", year=1995,
        poster="https://m.media-amazon.com/images/M/MV5BOTUwODM5MTctZjczMi00OTk4LTg3NWUtNmVhMTAzNTNjYjcyXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        description="Detectives hunt a serial killer who uses the seven deadly sins.",
        description_ru="Детективы охотятся на убийцу, использующего семь смертных грехов.",
        why_recommended=["Мрачный детектив", "Незабываемый финал", "Стиль Финчера"],
        rating=8.6, reviews=[{"author": "NoirFan", "text": "Мрачный шедевр", "rating": 5, "date": "10 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "gone_girl": MovieDetail(
        id="gone_girl", title="Gone Girl", title_ru="Исчезнувшая", year=2014,
        poster="https://m.media-amazon.com/images/M/MV5BMTk0MDQ3MzAzOV5BMl5BanBnXkFtZTgwNzU1NzE3MjE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
        description="A man becomes the suspect when his wife goes missing.",
        description_ru="Мужчина становится подозреваемым после исчезновения жены.",
        why_recommended=["Напряжённый триллер", "Неожиданные повороты", "Блестящая игра"],
        rating=8.1, reviews=[{"author": "ThrillerFan", "text": "Финчер в ударе", "rating": 5, "date": "5 марта 2024"}],
        watch_providers=[{"name": "Okko", "url": "https://okko.tv", "icon": "film"}]
    ),
    "zodiac": MovieDetail(
        id="zodiac", title="Zodiac", title_ru="Зодиак", year=2007,
        poster="https://m.media-amazon.com/images/M/MV5BN2UwNDc5NmEtNjVjZS00OTI5LWE5YjctMWM3ZjBiZGE0OWI0XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="A cartoonist becomes obsessed with tracking down the Zodiac Killer.",
        description_ru="Карикатурист одержим поиском убийцы Зодиака.",
        why_recommended=["Реальная история", "Атмосфера 70-х", "Детективное расследование"],
        rating=7.7, reviews=[{"author": "TrueCrimeFan", "text": "История одержимости", "rating": 4, "date": "15 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "sicario": MovieDetail(
        id="sicario", title="Sicario", title_ru="Убийца", year=2015,
        poster="https://m.media-amazon.com/images/M/MV5BMjA5NjM3NTk1M15BMl5BanBnXkFtZTgwMzg1MzU2NjE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="An FBI agent is enlisted to take down a Mexican drug cartel.",
        description_ru="Агент ФБР привлечён для уничтожения мексиканского картеля.",
        why_recommended=["Напряжённый экшен", "Моральная неоднозначность", "Стиль Вильнёва"],
        rating=7.6, reviews=[{"author": "ActionFan", "text": "Шедевр напряжения", "rating": 5, "date": "1 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "nightcrawler": MovieDetail(
        id="nightcrawler", title="Nightcrawler", title_ru="Стрингер", year=2014,
        poster="https://m.media-amazon.com/images/M/MV5BN2U1YWRhMWItM2M4YS00MTM0LWFmNjItMDI4YjRlNTU2OGVjXkEyXkFqcGdeQXVyNTIzOTk5ODM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="A driven man enters the world of crime journalism in LA.",
        description_ru="Амбициозный человек входит в мир криминальной журналистики.",
        why_recommended=["Тёмная драма", "Выдающаяся игра", "Неоновый Лос-Анджелес"],
        rating=7.8, reviews=[{"author": "DramaFan", "text": "Гилленхол великолепен", "rating": 5, "date": "20 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    # === DRAMA ===
    "donnie_darko": MovieDetail(
        id="donnie_darko", title="Donnie Darko", title_ru="Донни Дарко", year=2001,
        poster="https://m.media-amazon.com/images/M/MV5BZjZlZDlkYTktMmU1My00ZDBiLWFlNjEtYTBhNjVhOTM4ZjJjXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200",
        description="A troubled teenager is plagued by visions of a man in a rabbit suit.",
        description_ru="Проблемного подростка преследуют видения человека в костюме кролика.",
        why_recommended=["Культовая мистика", "Сюрреалистичный сюжет", "Атмосфера 80-х"],
        rating=8.0, reviews=[{"author": "CultFan", "text": "Загадочный шедевр", "rating": 5, "date": "10 февраля 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "mulholland_drive": MovieDetail(
        id="mulholland_drive", title="Mulholland Drive", title_ru="Малхолланд Драйв", year=2001,
        poster="https://m.media-amazon.com/images/M/MV5BYWFiYmQzYTItNDc5OC00NDUwLTkyMWItMWY5NmVkZDUwMjYyXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="An amnesiac woman pieces together her identity after a car wreck.",
        description_ru="Женщина с амнезией восстанавливает личность после аварии.",
        why_recommended=["Линчевский сюрреализм", "Загадочный нуар", "Многослойный сюжет"],
        rating=7.9, reviews=[{"author": "LynchFan", "text": "Линч в стихии", "rating": 5, "date": "5 января 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "lost_in_translation": MovieDetail(
        id="lost_in_translation", title="Lost in Translation", title_ru="Трудности перевода", year=2003,
        poster="https://m.media-amazon.com/images/M/MV5BMTUxMjE0NTg4OF5BMl5BanBnXkFtZTYwNTM0ODc2._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="Two Americans form an unlikely bond in Tokyo.",
        description_ru="Два американца находят неожиданную связь в Токио.",
        why_recommended=["Меланхоличная атмосфера", "Тонкий юмор", "Токийская эстетика"],
        rating=7.7, reviews=[{"author": "ArtFan", "text": "Красивое одиночество", "rating": 5, "date": "1 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "requiem_dream": MovieDetail(
        id="requiem_dream", title="Requiem for a Dream", title_ru="Реквием по мечте", year=2000,
        poster="https://m.media-amazon.com/images/M/MV5BOTdiNzJlOWUtNWMwNS00NmFlLWI0YTctZjNhNmZjMzg0ZTk5XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="Four people pursue their dreams but face addiction.",
        description_ru="Четыре человека преследуют свои мечты, но сталкиваются с зависимостью.",
        why_recommended=["Визуальный стиль", "Эмоциональная мощь", "Незабываемое впечатление"],
        rating=8.3, reviews=[{"author": "DramaFan", "text": "Потрясающая режиссура", "rating": 5, "date": "15 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "american_beauty": MovieDetail(
        id="american_beauty", title="American Beauty", title_ru="Красота по-американски", year=1999,
        poster="https://m.media-amazon.com/images/M/MV5BNTBmZWJkNjctNDhiNC00MGE2LWEwOTctZTk5OGVhMWMyNmVhXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
        description="A suburban man has a midlife crisis.",
        description_ru="Мужчина из пригорода переживает кризис среднего возраста.",
        why_recommended=["Социальная сатира", "Отличная режиссура", "Глубокий подтекст"],
        rating=8.3, reviews=[{"author": "DramaFan", "text": "Классика 90-х", "rating": 5, "date": "10 января 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "there_will_be_blood": MovieDetail(
        id="there_will_be_blood", title="There Will Be Blood", title_ru="Нефть", year=2007,
        poster="https://m.media-amazon.com/images/M/MV5BMjAxODQ4MDU5NV5BMl5BanBnXkFtZTcwMDU4MjU1MQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="A story of ambition, faith, and oil in early 20th century America.",
        description_ru="История амбиций, веры и нефти в Америке начала XX века.",
        why_recommended=["Эпическая драма", "Выдающаяся игра", "Визуальное великолепие"],
        rating=8.2, reviews=[{"author": "EpicFan", "text": "Дэй-Льюис гениален", "rating": 5, "date": "20 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "whiplash": MovieDetail(
        id="whiplash", title="Whiplash", title_ru="Одержимость", year=2014,
        poster="https://m.media-amazon.com/images/M/MV5BOTA5NDZlZGUtMjAxOS00YTRkLTkwYmMtYWQ0NWEwZDZiNjEzXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="A young drummer strives for perfection under a tyrannical instructor.",
        description_ru="Молодой барабанщик стремится к совершенству под руководством тирана.",
        why_recommended=["Напряжённая драма", "Музыкальное мастерство", "Противостояние характеров"],
        rating=8.5, reviews=[{"author": "MusicFan", "text": "Держит в напряжении", "rating": 5, "date": "15 марта 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "social_network": MovieDetail(
        id="social_network", title="The Social Network", title_ru="Социальная сеть", year=2010,
        poster="https://m.media-amazon.com/images/M/MV5BOGUyZDUxZjEtMmIzMC00MzlmLTg4MGItZWJmMzBhZjE0Mjc1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200",
        description="The story of Facebook's founding and legal battles.",
        description_ru="История создания Facebook и судебных баталий.",
        why_recommended=["Острый диалог", "Темп и энергия", "Портрет амбиций"],
        rating=7.8, reviews=[{"author": "TechFan", "text": "Финчер + Соркин = шедевр", "rating": 5, "date": "1 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "black_swan": MovieDetail(
        id="black_swan", title="Black Swan", title_ru="Чёрный лебедь", year=2010,
        poster="https://m.media-amazon.com/images/M/MV5BNzY2NzI4OTE5MF5BMl5BanBnXkFtZTcwMjMyNDY4Mw@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="A ballerina struggles with the demands of her role in Swan Lake.",
        description_ru="Балерина борется с требованиями роли в Лебедином озере.",
        why_recommended=["Психологический триллер", "Визуальная красота", "Исследование перфекционизма"],
        rating=8.0, reviews=[{"author": "ArtFan", "text": "Портман великолепна", "rating": 5, "date": "10 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    # === MYSTERY/HORROR ===
    "shining": MovieDetail(
        id="shining", title="The Shining", title_ru="Сияние", year=1980,
        poster="https://m.media-amazon.com/images/M/MV5BZWFlYmY2MGEtZjVkYS00YzU4LTg0YjQtYzY1ZGE3NTA5NGQxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="A family heads to an isolated hotel for the winter.",
        description_ru="Семья отправляется в изолированный отель на зиму.",
        why_recommended=["Классика хоррора", "Визуальное мастерство Кубрика", "Атмосфера безумия"],
        rating=8.4, reviews=[{"author": "HorrorFan", "text": "Эталон жанра", "rating": 5, "date": "31 октября 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "get_out": MovieDetail(
        id="get_out", title="Get Out", title_ru="Прочь", year=2017,
        poster="https://m.media-amazon.com/images/M/MV5BMjUxMDQwNjcyNl5BMl5BanBnXkFtZTgwNzcwMzc0MTI@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="A young Black man visits his white girlfriend's family estate.",
        description_ru="Молодой чернокожий мужчина навещает семью своей белой девушки.",
        why_recommended=["Социальный хоррор", "Неожиданные повороты", "Острая сатира"],
        rating=7.7, reviews=[{"author": "HorrorFan", "text": "Свежий взгляд на жанр", "rating": 5, "date": "20 марта 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "hereditary": MovieDetail(
        id="hereditary", title="Hereditary", title_ru="Реинкарнация", year=2018,
        poster="https://m.media-amazon.com/images/M/MV5BOTU5MDg3OGItZWQ1Ny00ZGVmLTg2YTUtMzBkYzQ1YWIwZjlhXkEyXkFqcGdeQXVyNTAzMTY4MDA@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="A family is haunted after the death of their grandmother.",
        description_ru="Семью преследуют духи после смерти бабушки.",
        why_recommended=["Атмосферный хоррор", "Семейная драма", "Нарастающий ужас"],
        rating=7.3, reviews=[{"author": "HorrorFan", "text": "Пугает до костей", "rating": 5, "date": "15 октября 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "midsommar": MovieDetail(
        id="midsommar", title="Midsommar", title_ru="Солнцестояние", year=2019,
        poster="https://m.media-amazon.com/images/M/MV5BMzQxNzQzOTQwM15BMl5BanBnXkFtZTgwMDQ2NTcwODM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200",
        description="A couple travels to Sweden for a festival that turns sinister.",
        description_ru="Пара едет в Швецию на фестиваль, который становится зловещим.",
        why_recommended=["Фолк-хоррор", "Дневной ужас", "Визуальное великолепие"],
        rating=7.1, reviews=[{"author": "ArtHorror", "text": "Красивый кошмар", "rating": 4, "date": "21 июня 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "sixth_sense": MovieDetail(
        id="sixth_sense", title="The Sixth Sense", title_ru="Шестое чувство", year=1999,
        poster="https://m.media-amazon.com/images/M/MV5BMWM4NTFhYjctNzUyNi00NGMwLTk3NTYtMDIyNTZmMzRlYmQyXkEyXkFqcGdeQXVyMTAwMzUyOTc@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
        description="A child psychologist helps a boy who can see ghosts.",
        description_ru="Детский психолог помогает мальчику, который видит призраков.",
        why_recommended=["Классика мистики", "Легендарный твист", "Атмосфера тайны"],
        rating=8.1, reviews=[{"author": "MysteryFan", "text": "Один из лучших финалов", "rating": 5, "date": "1 ноября 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    # === ACTION/CRIME ===
    "dark_knight": MovieDetail(
        id="dark_knight", title="The Dark Knight", title_ru="Тёмный рыцарь", year=2008,
        poster="https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="Batman faces the Joker, a criminal mastermind.",
        description_ru="Бэтмен противостоит Джокеру, гениальному преступнику.",
        why_recommended=["Эпический супергеройский фильм", "Легендарный Джокер", "Нолан в лучшем виде"],
        rating=9.0, reviews=[{"author": "ComicFan", "text": "Лучший фильм о супергероях", "rating": 5, "date": "18 июля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "pulp_fiction": MovieDetail(
        id="pulp_fiction", title="Pulp Fiction", title_ru="Криминальное чтиво", year=1994,
        poster="https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="The lives of two hitmen, a boxer, and others intertwine.",
        description_ru="Жизни двух киллеров, боксёра и других переплетаются.",
        why_recommended=["Культовая классика", "Нелинейный сюжет", "Стиль Тарантино"],
        rating=8.9, reviews=[{"author": "CultFan", "text": "Определил 90-е", "rating": 5, "date": "14 октября 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "goodfellas": MovieDetail(
        id="goodfellas", title="Goodfellas", title_ru="Славные парни", year=1990,
        poster="https://m.media-amazon.com/images/M/MV5BY2NkZjEzMDgtN2RjYy00YzM1LWI4ZmQtMjIwYjFjNmI3ZGEwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="The story of Henry Hill and his life in the mob.",
        description_ru="История Генри Хилла и его жизни в мафии.",
        why_recommended=["Классика гангстерского жанра", "Скорсезе в ударе", "Реальная история"],
        rating=8.7, reviews=[{"author": "CrimeFan", "text": "Эталон жанра", "rating": 5, "date": "19 сентября 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "heat": MovieDetail(
        id="heat", title="Heat", title_ru="Схватка", year=1995,
        poster="https://m.media-amazon.com/images/M/MV5BYjZjNTJlZGUtZTE1Ny00ZDc4LTgwYjUtMzk0NDgwYzZjYTk1XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="A cop and a criminal face off in Los Angeles.",
        description_ru="Коп и преступник сталкиваются в Лос-Анджелесе.",
        why_recommended=["Эпическая криминальная драма", "Де Ниро vs Пачино", "Легендарная перестрелка"],
        rating=8.3, reviews=[{"author": "ActionFan", "text": "Два титана на экране", "rating": 5, "date": "15 декабря 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "departed": MovieDetail(
        id="departed", title="The Departed", title_ru="Отступники", year=2006,
        poster="https://m.media-amazon.com/images/M/MV5BMTI1MTY2OTIxNV5BMl5BanBnXkFtZTYwNjQ4NjY3._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="An undercover cop and a mole try to identify each other.",
        description_ru="Полицейский под прикрытием и крот пытаются раскрыть друг друга.",
        why_recommended=["Напряжённый триллер", "Звёздный состав", "Оскар за режиссуру"],
        rating=8.5, reviews=[{"author": "ThrillerFan", "text": "Скорсезе триумфирует", "rating": 5, "date": "6 октября 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "oldboy": MovieDetail(
        id="oldboy", title="Oldboy", title_ru="Олдбой", year=2003,
        poster="https://m.media-amazon.com/images/M/MV5BMTI3NTQyMzU5M15BMl5BanBnXkFtZTcwMTM2MjgyMQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="A man is imprisoned for 15 years and seeks revenge.",
        description_ru="Мужчина заключён на 15 лет и ищет мести.",
        why_recommended=["Корейский шедевр", "Шокирующий твист", "Стильное насилие"],
        rating=8.4, reviews=[{"author": "AsianCinema", "text": "Незабываемый опыт", "rating": 5, "date": "22 ноября 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "parasite": MovieDetail(
        id="parasite", title="Parasite", title_ru="Паразиты", year=2019,
        poster="https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
        description="A poor family schemes to become employed by a wealthy family.",
        description_ru="Бедная семья планирует устроиться на работу к богатой семье.",
        why_recommended=["Оскар за лучший фильм", "Социальная сатира", "Неожиданные повороты"],
        rating=8.5, reviews=[{"author": "WorldCinema", "text": "Заслуженный Оскар", "rating": 5, "date": "9 февраля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    # === ADDITIONAL FILMS ===
    "la_la_land": MovieDetail(
        id="la_la_land", title="La La Land", title_ru="Ла-Ла Ленд", year=2016,
        poster="https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200",
        description="A jazz musician and an aspiring actress fall in love in LA.",
        description_ru="Джазовый музыкант и начинающая актриса влюбляются в Лос-Анджелесе.",
        why_recommended=["Музыкальный шедевр", "Визуальная красота", "Романтика и мечты"],
        rating=8.0, reviews=[{"author": "MusicalFan", "text": "Волшебный мюзикл", "rating": 5, "date": "14 февраля 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "mad_max_fury": MovieDetail(
        id="mad_max_fury", title="Mad Max: Fury Road", title_ru="Безумный Макс: Дорога ярости", year=2015,
        poster="https://m.media-amazon.com/images/M/MV5BN2EwM2I5OWMtMGQyMi00Zjg1LWJkNTctZTdjYTA4OGUwZjMyXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200",
        description="In a post-apocalyptic wasteland, Max joins a rebellion.",
        description_ru="В постапокалиптической пустоши Макс присоединяется к восстанию.",
        why_recommended=["Визуальный экшен", "Безостановочное действие", "Практические эффекты"],
        rating=8.1, reviews=[{"author": "ActionFan", "text": "Экшен нового уровня", "rating": 5, "date": "15 мая 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "joker": MovieDetail(
        id="joker", title="Joker", title_ru="Джокер", year=2019,
        poster="https://m.media-amazon.com/images/M/MV5BNGVjNWI4ZGUtNzE0MS00YTJmLWE0ZDctN2ZiYTk2YmI3NTYyXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        description="A failed comedian descends into madness in Gotham City.",
        description_ru="Неудавшийся комик погружается в безумие в Готэм-сити.",
        why_recommended=["Характерная драма", "Феникс великолепен", "Тёмная атмосфера"],
        rating=8.4, reviews=[{"author": "DramaFan", "text": "Оскар заслужен", "rating": 5, "date": "4 октября 2024"}],
        watch_providers=[{"name": "IVI", "url": "https://ivi.ru", "icon": "tv"}]
    ),
    "tenet": MovieDetail(
        id="tenet", title="Tenet", title_ru="Довод", year=2020,
        poster="https://m.media-amazon.com/images/M/MV5BYzg0NGM2NjAtNmIxOC00MDJmLTg5ZmYtYzM0MTE4NWE2NzlhXkEyXkFqcGdeQXVyMTA4NjE0NjEy._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
        description="A secret agent manipulates time to prevent World War III.",
        description_ru="Секретный агент манипулирует временем, чтобы предотвратить Третью мировую.",
        why_recommended=["Временные парадоксы", "Сложный сюжет", "Визуальные эффекты"],
        rating=7.3, reviews=[{"author": "SciFiFan", "text": "Нолан экспериментирует", "rating": 4, "date": "26 августа 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
    "oppenheimer": MovieDetail(
        id="oppenheimer", title="Oppenheimer", title_ru="Оппенгеймер", year=2023,
        poster="https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg",
        backdrop="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
        description="The story of the man who created the atomic bomb.",
        description_ru="История человека, создавшего атомную бомбу.",
        why_recommended=["Эпическая биография", "Звёздный состав", "Историческая драма"],
        rating=8.4, reviews=[{"author": "HistoryFan", "text": "Триумф Нолана", "rating": 5, "date": "21 июля 2024"}],
        watch_providers=[{"name": "Кинопоиск", "url": "https://kinopoisk.ru", "icon": "play"}]
    ),
}

# Get all movie IDs
ALL_MOVIE_IDS = list(MOCK_MOVIES.keys())
