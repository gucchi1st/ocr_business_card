import json
import mimetypes
from pathlib import Path

from google import genai
from google.genai import types

from config import BASE_DIR
from schemas.business_card import BusinessCard


SETTINGS_FILE = BASE_DIR / "data" / "settings.json"


def load_gemini_api_key() -> str:
    if not SETTINGS_FILE.exists():
        raise ValueError(
            "Chưa có file data/settings.json. "
            "Vui lòng mở Settings và nhập Gemini API Key."
        )

    try:
        with open(
            SETTINGS_FILE,
            "r",
            encoding="utf-8"
        ) as f:
            settings = json.load(f)

    except Exception as e:
        raise ValueError(
            f"Không đọc được settings.json: {e}"
        )

    api_key = str(
        settings.get(
            "gemini_api_key",
            ""
        )
    ).strip()

    if not api_key:
        raise ValueError(
            "Chưa cấu hình Gemini API Key. "
            "Vui lòng mở Settings và nhập API Key."
        )

    return api_key


OCR_PROMPT = """
You are a professional business card OCR system.

You may receive ONE or TWO images of the SAME business card.

If two images are provided:

- The first image is the FRONT.
- The second image is the BACK.
- They belong to the SAME person and SAME business card.
- MERGE all information from both images into ONE result.

Analyze all provided business card images carefully.

Extract ONLY information that is clearly visible and readable.

IMPORTANT RULES:

1. Never invent information.
2. Never guess unreadable information.
3. If information is missing, return null.
4. If NAME is missing, return null.
5. If POSITION is missing, return null.
6. Preserve Vietnamese personal names exactly.
7. Do not translate Vietnamese personal names.
8. Preserve company names as they appear on the card.
9. If Vietnamese and English company names are visible,
   separate them into company_vietnamese and company_english.
10. Do not invent a Vietnamese or English company name.

PHONE RULES:

11. Remove "+" from all phone numbers.
12. Never extract fax numbers.
13. Telephone / landline numbers go into TEL fields.
14. Mobile numbers go into MOBILE fields.
15. Maximum 2 TEL numbers.
16. Maximum 2 MOBILE numbers.

EMAIL / WEBSITE:

17. Maximum 2 email addresses.
18. Maximum 1 website.
19. Preserve email addresses exactly.
20. Preserve website exactly.

ADDRESS:

21. Preserve the address exactly when possible.
22. Do not translate the address.
23. Extract province if clearly available.
24. Extract country if clearly available.

MERGING TWO SIDES:

25. If information exists only on the FRONT, keep it.
26. If information exists only on the BACK, keep it.
27. Combine information from both sides.
28. Do not duplicate identical information.
29. If a field contains multiple values, distribute them
    according to the TEL/MOBILE/EMAIL rules above.
30. Never create a second person or second company.
31. Both images belong to ONE business card.
32. Do not determine industry or sector from the image.
33. Industry and sector will be determined separately.

Return ONLY JSON.

Fields:

name
job_title
company_vietnamese
company_english
tel_1
tel_2
mobile_1
mobile_2
email_1
email_2
website
address
province
country

Do not return explanations.
"""


def get_mime_type(
    image_path: Path
) -> str:

    mime_type, _ = mimetypes.guess_type(
        str(image_path)
    )

    return mime_type or "image/jpeg"


def extract_business_card(
    image_paths: list[Path]
) -> dict:

    if not image_paths:
        raise ValueError(
            "Không có ảnh business card."
        )

    api_key = load_gemini_api_key()

    gemini_client = genai.Client(
        api_key=api_key
    )

    contents = []

    for image_path in image_paths:

        image_path = Path(image_path)

        if not image_path.exists():
            raise ValueError(
                f"Không tìm thấy ảnh: {image_path}"
            )

        with open(
            image_path,
            "rb"
        ) as f:

            image_bytes = f.read()

        mime_type = get_mime_type(
            image_path
        )

        contents.append(
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type
            )
        )

    contents.append(OCR_PROMPT)

    try:

        response = (
            gemini_client
            .models
            .generate_content(
                model="gemini-3.6-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BusinessCard,
                )
            )
        )

    except Exception as e:

        raise RuntimeError(
            f"Lỗi Gemini API: "
            f"{type(e).__name__}: {e}"
        ) from e

    if response.parsed:
        return response.parsed.model_dump()

    if response.text:

        try:
            return json.loads(
                response.text
            )

        except json.JSONDecodeError as e:

            raise ValueError(
                f"Gemini trả về JSON không hợp lệ: {e}"
            ) from e

    raise ValueError(
        "Gemini không trả về dữ liệu OCR."
    )