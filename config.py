import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:20feb2006@localhost:5432/club_management')
SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key-change-me')
DB_POOL_MIN = 1
DB_POOL_MAX = 20

CLUB_SECRET_KEYS = {
    "Genesis":        "GEN-2025-XKQT",
    "Numerano":       "NUM-2025-PLMW",
    "ByteSync":       "BYT-2025-ZRFN",
    "AWS Cloud Club": "AWS-2025-HVDC"
}
