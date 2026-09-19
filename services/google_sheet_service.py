import gspread

from google.oauth2.service_account import Credentials

from config import (
    CREDENTIALS_FILE,
    GOOGLE_SHEET_NAME,
    GOOGLE_SHEET_URL,
)


GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def get_worksheet():

    if not CREDENTIALS_FILE.exists():
        raise ValueError(
            "Không tìm thấy credentials/service-account.json"
        )

    if not GOOGLE_SHEET_URL:
        raise ValueError(
            "Chưa cấu hình GOOGLE_SHEET_URL."
        )

    credentials = (
        Credentials
        .from_service_account_file(
            str(CREDENTIALS_FILE),
            scopes=GOOGLE_SCOPES
        )
    )

    client = gspread.authorize(
        credentials
    )

    spreadsheet = client.open_by_url(
        GOOGLE_SHEET_URL
    )

    try:

        worksheet = spreadsheet.worksheet(
            GOOGLE_SHEET_NAME
        )

    except gspread.WorksheetNotFound:

        worksheet = spreadsheet.sheet1

    return worksheet


def value_or_dot(value):

    if value is None:
        return "."

    value = str(value).strip()

    if not value:
        return "."

    return value


def save_business_card(
    data: dict
):

    worksheet = get_worksheet()

    row = [
        value_or_dot(
            data.get("name")
        ),
        value_or_dot(
            data.get("job_title")
        ),
        value_or_dot(
            data.get("company_vietnamese")
        ),
        value_or_dot(
            data.get("company_english")
        ),
        value_or_dot(
            data.get("tel_1")
        ),
        value_or_dot(
            data.get("tel_2")
        ),
        value_or_dot(
            data.get("mobile_1")
        ),
        value_or_dot(
            data.get("mobile_2")
        ),
        value_or_dot(
            data.get("email_1")
        ),
        value_or_dot(
            data.get("email_2")
        ),
        value_or_dot(
            data.get("website")
        ),
        value_or_dot(
            data.get("address")
        ),
        value_or_dot(
            data.get("province")
        ),
        value_or_dot(
            data.get("country")
        ),
        value_or_dot(
            data.get("industry")
        ),
        value_or_dot(
            data.get("sector")
        ),
    ]

    worksheet.append_row(
        row,
        value_input_option="USER_ENTERED"
    )

    return True