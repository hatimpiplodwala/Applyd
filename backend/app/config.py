import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.supabase_url: str = os.environ["SUPABASE_URL"]
        self.supabase_anon_key: str = os.environ["SUPABASE_ANON_KEY"]
        self.cors_origins: list[str] = [
            o.strip()
            for o in os.environ.get(
                "CORS_ORIGINS", "http://localhost:3000"
            ).split(",")
            if o.strip()
        ]
        # Optional: enables POST /applications/parse-url. Empty string -> disabled.
        self.gemini_api_key: str = os.environ.get(
            "GEMINI_API_KEY", ""
        ).strip()


@lru_cache
def get_settings() -> Settings:
    return Settings()
