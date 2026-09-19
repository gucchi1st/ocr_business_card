import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


BASE_DIR = Path(__file__).resolve().parent

TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"
CREDENTIALS_DIR = BASE_DIR / "credentials"

CREDENTIALS_FILE = CREDENTIALS_DIR / "service-account.json"
SETTINGS_FILE = DATA_DIR / "settings.json"


# Google Sheet dùng để test
GOOGLE_SHEET_URL = os.getenv(
    "GOOGLE_SHEET_URL",
    ""
)

# Tên worksheet/tab
GOOGLE_SHEET_NAME = os.getenv(
    "GOOGLE_SHEET_NAME",
    "Business Cards"
)


DATA_DIR.mkdir(
    parents=True,
    exist_ok=True
)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True

)

CREDENTIALS_DIR.mkdir(
    parents=True,
    exist_ok=True
)