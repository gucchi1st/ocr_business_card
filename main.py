from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
)

from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel

from pathlib import Path
from typing import List

import json
import uuid
import shutil
import traceback

from config import (
    BASE_DIR,
    UPLOAD_DIR,
)

from services.gemini_service import (
    extract_business_card,
)

from services.google_sheet_service import (
    save_business_card,
)


app = FastAPI(
    title="Business Card OCR"
)


UPLOAD_DIR = Path(UPLOAD_DIR)

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(
    parents=True,
    exist_ok=True
)


SETTINGS_FILE = DATA_DIR / "settings.json"


DEFAULT_SETTINGS = {
    "gemini_api_key": "",
    "google_sheet_url": "",
    "google_credentials_path": ""
}


def load_settings():

    if not SETTINGS_FILE.exists():
        return DEFAULT_SETTINGS.copy()

    try:

        with open(
            SETTINGS_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

        return {
            **DEFAULT_SETTINGS,
            **data
        }

    except Exception:

        return DEFAULT_SETTINGS.copy()


def save_settings(settings):

    with open(
        SETTINGS_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            settings,
            f,
            ensure_ascii=False,
            indent=4
        )


class SettingsUpdate(BaseModel):

    gemini_api_key: str = ""
    google_sheet_url: str = ""
    google_credentials_path: str = ""


cards = {}


def normalize_data(data):

    fields = [
        "name",
        "job_title",
        "company_vietnamese",
        "company_english",
        "tel_1",
        "tel_2",
        "mobile_1",
        "mobile_2",
        "email_1",
        "email_2",
        "website",
        "address",
        "province",
        "country",
        "industry",
        "sector",
    ]

    result = {}

    for field in fields:

        value = data.get(
            field,
            "."
        )

        if value is None:
            value = "."

        value = str(value).strip()

        if not value:
            value = "."

        result[field] = value

    result["industry"] = "."
    result["sector"] = "."

    return result


app.mount(
    "/static",
    StaticFiles(
        directory=BASE_DIR / "static"
    ),
    name="static"
)


app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOAD_DIR
    ),
    name="uploads"
)


@app.get(
    "/",
    response_class=HTMLResponse
)
async def home():

    index_file = (
        BASE_DIR
        / "templates"
        / "index.html"
    )

    if not index_file.exists():

        raise HTTPException(
            status_code=500,
            detail=(
                "Không tìm thấy "
                "templates/index.html"
            )
        )

    return index_file.read_text(
        encoding="utf-8"
    )


@app.get("/api/settings")
async def get_settings():

    settings = load_settings()

    return {
        "success": True,
        "settings": {
            "gemini_configured": bool(
                settings.get(
                    "gemini_api_key",
                    ""
                ).strip()
            ),
            "google_sheet_url": settings.get(
                "google_sheet_url",
                ""
            ),
            "google_credentials_path": settings.get(
                "google_credentials_path",
                ""
            ),
        }
    }


@app.put("/api/settings")
async def update_settings(
    payload: SettingsUpdate
):

    settings = load_settings()

    api_key = (
        payload.gemini_api_key
        .strip()
    )

    if api_key:
        settings["gemini_api_key"] = api_key

    sheet_url = (
        payload.google_sheet_url
        .strip()
    )

    if sheet_url:
        settings["google_sheet_url"] = sheet_url

    credentials_path = (
        payload.google_credentials_path
        .strip()
    )

    if credentials_path:
        settings[
            "google_credentials_path"
        ] = credentials_path

    save_settings(settings)

    return {
        "success": True,
        "message": "Đã lưu Settings"
    }


@app.post("/upload-batch")
async def upload_batch(
    files: List[UploadFile] = File(...),
    mode: str = "single"
):

    if not files:

        raise HTTPException(
            status_code=400,
            detail="Không có file nào được upload"
        )

    if mode == "two-sided":

        if len(files) % 2 != 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Chế độ 2 mặt yêu cầu "
                    "số lượng ảnh phải là số chẵn."
                )
            )

    uploaded_cards = []

    if mode == "single":

        for file in files:

            card_id = str(
                uuid.uuid4()
            )

            extension = Path(
                file.filename
            ).suffix.lower()

            if not extension:
                extension = ".jpg"

            filename = (
                f"{card_id}{extension}"
            )

            file_path = (
                UPLOAD_DIR / filename
            )

            with open(
                file_path,
                "wb"
            ) as buffer:

                shutil.copyfileobj(
                    file.file,
                    buffer
                )

            image_url = (
                f"/uploads/{filename}"
            )

            card = {
                "id": card_id,
                "mode": "single",
                "filename": file.filename,
                "image": image_url,
                "images": [
                    image_url
                ],
                "status": "pending",
                "data": normalize_data({})
            }

            cards[card_id] = card
            uploaded_cards.append(card)

    else:

        for i in range(
            0,
            len(files),
            2
        ):

            front_file = files[i]
            back_file = files[i + 1]

            card_id = str(
                uuid.uuid4()
            )

            front_extension = Path(
                front_file.filename
            ).suffix.lower()

            back_extension = Path(
                back_file.filename
            ).suffix.lower()

            if not front_extension:
                front_extension = ".jpg"

            if not back_extension:
                back_extension = ".jpg"

            front_filename = (
                f"{card_id}_front"
                f"{front_extension}"
            )

            back_filename = (
                f"{card_id}_back"
                f"{back_extension}"
            )

            front_path = (
                UPLOAD_DIR
                / front_filename
            )

            back_path = (
                UPLOAD_DIR
                / back_filename
            )

            with open(
                front_path,
                "wb"
            ) as buffer:

                shutil.copyfileobj(
                    front_file.file,
                    buffer
                )

            with open(
                back_path,
                "wb"
            ) as buffer:

                shutil.copyfileobj(
                    back_file.file,
                    buffer
                )

            front_url = (
                f"/uploads/{front_filename}"
            )

            back_url = (
                f"/uploads/{back_filename}"
            )

            card = {
                "id": card_id,
                "mode": "two-sided",
                "filename": (
                    f"{front_file.filename} + "
                    f"{back_file.filename}"
                ),
                "images": [
                    front_url,
                    back_url
                ],
                "status": "pending",
                "data": normalize_data({})
            }

            cards[card_id] = card
            uploaded_cards.append(card)

    return {
        "success": True,
        "cards": uploaded_cards
    }


@app.get("/card/{card_id}")
async def get_card(card_id: str):

    card = cards.get(card_id)

    if not card:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy card"
        )

    return {
        "success": True,
        "card": card
    }


@app.put("/card/{card_id}")
async def update_card(
    card_id: str,
    data: dict
):

    card = cards.get(card_id)

    if not card:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy card"
        )

    card["data"] = normalize_data(data)

    cards[card_id] = card

    return {
        "success": True,
        "card": card
    }


@app.post("/process/{card_id}")
async def process_card(card_id: str):

    card = cards.get(card_id)

    if not card:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy card"
        )

    try:

        card["status"] = "processing"

        image_paths = []

        for image_url in card.get(
            "images",
            []
        ):

            filename = Path(
                image_url
            ).name

            image_path = (
                UPLOAD_DIR
                / filename
            )

            if not image_path.exists():

                raise Exception(
                    f"Không tìm thấy ảnh: {filename}"
                )

            image_paths.append(
                image_path
            )

        result = extract_business_card(
            image_paths
        )

        if result is None:
            result = {}

        result = normalize_data(
            result
        )

        card["data"] = result
        card["status"] = "processed"

        cards[card_id] = card

        return {
            "success": True,
            "card": card
        }

    except Exception as e:

        card["status"] = "error"
        cards[card_id] = card

        print(
            "\n========== OCR ERROR =========="
        )

        traceback.print_exc()

        print(
            "================================\n"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post(
    "/cards/{card_id}/save"
)
async def save_card(
    card_id: str
):

    card = cards.get(card_id)

    if not card:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy card"
        )

    try:

        data = card.get(
            "data",
            {}
        )

        result = save_business_card(
            data
        )

        card["status"] = "saved"

        cards[card_id] = card

        return {
            "success": True,
            "message": "Đã lưu vào Google Sheet",
            "result": result
        }

    except Exception as e:

        print(
            "\n========== SHEET ERROR =========="
        )

        traceback.print_exc()

        print(
            "=================================\n"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.delete(
    "/card/{card_id}"
)
async def delete_card(
    card_id: str
):

    card = cards.get(card_id)

    if not card:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy card"
        )

    for image_url in card.get(
        "images",
        []
    ):

        filename = Path(
            image_url
        ).name

        file_path = (
            UPLOAD_DIR
            / filename
        )

        if file_path.exists():

            try:
                file_path.unlink()
            except Exception:
                pass

    del cards[card_id]

    return {
        "success": True,
        "message": "Đã xóa card"
    }


@app.get("/api/health")
async def health():

    settings = load_settings()

    return {
        "success": True,
        "gemini_configured": bool(
            settings.get(
                "gemini_api_key",
                ""
            ).strip()
        ),
        "google_sheet_configured": bool(
            settings.get(
                "google_sheet_url",
                ""
            ).strip()
        ),
        "cards": len(cards)
    }