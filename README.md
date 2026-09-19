# Business Card OCR

Ứng dụng OCR danh thiếp sử dụng AI để tự động nhận diện và trích xuất thông tin từ hình ảnh danh thiếp, sau đó cho phép người dùng kiểm tra, chỉnh sửa và lưu dữ liệu vào Google Sheets.

---
<img width="433" height="318" alt="image" src="https://github.com/user-attachments/assets/75f11603-450d-4e2a-8c42-a1f8f46f2c82" />

<img width="738" height="792" alt="Screenshot 2026-09-19 075117" src="https://github.com/user-attachments/assets/102a494d-8d24-47b9-8cff-860427bb0f56" />

## 1. Giới thiệu

Business Card OCR được xây dựng nhằm tự động hóa quy trình nhập liệu danh thiếp.

Thay vì nhập thủ công từng thông tin, người dùng chỉ cần:

1. Upload ảnh danh thiếp.
<img width="1324" height="867" alt="Screenshot 2026-09-19 080240" src="https://github.com/user-attachments/assets/992001e5-8342-4e88-84c5-52cc85be0d19" />

2. Chạy OCR.
3. Kiểm tra thông tin được nhận diện.
<img width="1562" height="833" alt="Screenshot 2026-09-19 080638" src="https://github.com/user-attachments/assets/09cce71b-e3b5-49da-ada6-dfd24c797cc4" />

4. Chỉnh sửa nếu cần.
5. Lưu dữ liệu vào Google Sheets.
<img width="1813" height="368" alt="Screenshot 2026-09-19 080713" src="https://github.com/user-attachments/assets/142bda8f-3ed2-43d6-bb58-605368eab121" />

Ứng dụng hỗ trợ:

- OCR danh thiếp một mặt.
- OCR danh thiếp hai mặt.
- Nhận diện tiếng Việt và tiếng Anh.
- Nhận diện nhiều số điện thoại.
- Nhận diện nhiều email.
- Nhận diện website.
- Nhận diện địa chỉ.
- Chỉnh sửa dữ liệu sau OCR.
- Lưu dữ liệu vào Google Sheets.
- Cấu hình Gemini API Key trực tiếp trên giao diện.
- Upload Google Service Account JSON trực tiếp trên giao diện.
- Lưu cấu hình để sử dụng lại cho những lần sau.

---

# 2. Công nghệ sử dụng

## Backend

- Python
- FastAPI
- Uvicorn
- Pydantic

## AI / OCR

- Google Gemini API
- Google Gen AI SDK

## Google Services

- Google Sheets API
- Google Service Account
- gspread

## Frontend

- HTML
- CSS
- JavaScript

## Đóng gói

- PyInstaller
- Windows `.exe`

---

# 3. Kiến trúc hệ thống

```text
                    ┌──────────────────────┐
                    │      Người dùng      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Web Interface   │
                    │      HTML/CSS/JS      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       FastAPI        │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │   Gemini API     │      │   Google Sheets  │
        │      OCR         │      │      Storage     │
        └──────────────────┘      └──────────────────┘
4. Chức năng chính
4.1 Upload Business Card

Người dùng có thể upload một hoặc nhiều hình ảnh danh thiếp.

Hai chế độ:

Single

Mỗi ảnh tương ứng với một danh thiếp.

card_001.jpg
card_002.jpg
card_003.jpg
Two-sided

Một danh thiếp gồm hai ảnh:

card_001_front.jpg
card_001_back.jpg

card_002_front.jpg
card_002_back.jpg

Thứ tự upload phải là:

Front → Back
Front → Back
Front → Back
5. OCR

Sau khi upload ảnh, hệ thống gửi hình ảnh đến Gemini để nhận diện thông tin.

Các trường dữ liệu:

Field	Mô tả
Name	Họ tên
Job Title	Chức vụ
Company Vietnamese	Tên công ty tiếng Việt
Company English	Tên công ty tiếng Anh
TEL 1	Số điện thoại 1
TEL 2	Số điện thoại 2
Mobile 1	Số điện thoại di động 1
Mobile 2	Số điện thoại di động 2
Email 1	Email 1
Email 2	Email 2
Website	Website
Address	Địa chỉ
Province	Tỉnh/Thành phố
Country	Quốc gia
Industry	Ngành
Sector	Lĩnh vực

Nếu thông tin không nhìn thấy hoặc không xác định được, hệ thống sử dụng:

.
6. Nguyên tắc OCR

Hệ thống được thiết kế theo các nguyên tắc:

Chỉ lấy thông tin nhìn thấy trên ảnh.
Không tự suy đoán thông tin.
Không tự tạo dữ liệu không có trên danh thiếp.
Giữ nguyên số điện thoại.
Không thêm dấu + vào số điện thoại.
Có thể nhận diện nhiều số điện thoại.
Có thể nhận diện nhiều email.
Không lấy số fax làm số điện thoại.
Giữ nguyên website nếu website xuất hiện trên danh thiếp.
Giữ nguyên địa chỉ theo thông tin nhìn thấy.
Nếu không chắc chắn thì trả về ..
7. Google Sheets

Sau khi OCR hoàn thành, người dùng có thể chỉnh sửa dữ liệu trước khi lưu.

Dữ liệu được lưu vào Google Sheets theo các cột:

Name
Job Title
Company Vietnamese
Company English
TEL 1
TEL 2
Mobile 1
Mobile 2
Email 1
Email 2
Website
Address
Province
Country
Industry
Sector

Tương ứng:

A  Name
B  Job Title
C  Company Vietnamese
D  Company English
E  TEL 1
F  TEL 2
G  Mobile 1
H  Mobile 2
I  Email 1
J  Email 2
K  Website
L  Address
M  Province
N  Country
O  Industry
P  Sector
8. Cấu hình lần đầu

Vào:

Cài đặt

Cần cấu hình:

Gemini API Key.
Google Sheet URL.
Google Sheet Name.
Google Service Account JSON.
9. Cấu hình Gemini API Key

Trong phần:

Gemini API Key

nhập API Key của Gemini.

Sau đó nhấn:

Lưu cài đặt

API Key được lưu trong file:

data/settings.json

Không chia sẻ file này nếu chứa API Key cá nhân.

10. Cấu hình Google Service Account

Trong phần:

Google Service Account Credentials

chọn file:

*.json

File này là Google Service Account JSON được tạo từ Google Cloud.

Ứng dụng sẽ upload và lưu Credentials vào:

data/google_credentials.json

Sau khi cấu hình lần đầu, không cần chọn lại file JSON mỗi lần chạy ứng dụng.

Nếu muốn thay Credentials:

Cài đặt
→ Chọn file JSON mới

Credentials mới sẽ thay thế Credentials cũ.

11. Cấp quyền Google Sheet

Đây là bước bắt buộc.

Mở file Google Service Account JSON.

Tìm:

"client_email": "xxxxx@xxxxx.iam.gserviceaccount.com"

Copy email này.

Mở Google Sheet:

Share / Chia sẻ

Thêm email Service Account.

Cấp quyền:

Editor

Sau đó ứng dụng mới có quyền ghi dữ liệu vào Google Sheet.

12. Kiểm tra Google Sheet

Sau khi nhập:

Google Sheet URL
Google Sheet Name
Service Account JSON

sử dụng chức năng:

Kiểm tra kết nối Google Sheet

Nếu thành công, hệ thống sẽ thông báo kết nối thành công.

13. Quy trình sử dụng

Quy trình cơ bản:

Mở ứng dụng
     ↓
Upload ảnh
     ↓
Chọn Single / Two-sided
     ↓
Process OCR
     ↓
Kiểm tra dữ liệu
     ↓
Chỉnh sửa nếu cần
     ↓
Save
     ↓
Google Sheet
14. Hướng dẫn sử dụng chi tiết
Bước 1: Khởi động

Chạy:

BusinessCardOCR.exe

Ứng dụng sẽ tự khởi động server và mở trình duyệt.

Nếu trình duyệt không tự mở, truy cập:

http://127.0.0.1:8000
Bước 2: Upload ảnh

Chọn:

Single

nếu mỗi danh thiếp chỉ có một ảnh.

Hoặc:

Two-sided

nếu danh thiếp có mặt trước và mặt sau.

Bước 3: Process OCR

Sau khi upload:

Process OCR

Hệ thống gửi ảnh đến Gemini và nhận kết quả OCR.

Bước 4: Kiểm tra

Kiểm tra các trường:

Name
Job Title
Company
Phone
Mobile
Email
Website
Address
Bước 5: Chỉnh sửa

Nếu OCR nhận diện sai, sửa trực tiếp trên giao diện.

Ví dụ:

OCR:
Nguyen Van A

Sửa:
Nguyễn Văn A
Bước 6: Save

Sau khi kiểm tra:

Save

Dữ liệu sẽ được lưu vào Google Sheet đã cấu hình.

15. Chạy nhiều danh thiếp

Có thể upload nhiều ảnh cùng lúc.

Ví dụ:

001.jpg
002.jpg
003.jpg
004.jpg
005.jpg

Sau đó xử lý từng Business Card.

Với danh thiếp hai mặt:

001_front.jpg
001_back.jpg
002_front.jpg
002_back.jpg
003_front.jpg
003_back.jpg
16. Thời gian xử lý

Thời gian OCR phụ thuộc vào:

Kích thước ảnh.
Chất lượng ảnh.
Số lượng ảnh.
Kết nối Internet.
Tốc độ phản hồi của Gemini API.
Chế độ Single hoặc Two-sided.

Quy trình xử lý:

Upload
   ↓
Đọc ảnh
   ↓
Gửi Gemini
   ↓
Gemini OCR
   ↓
Nhận JSON
   ↓
Hiển thị kết quả
17. Xử lý lỗi
Lỗi Gemini

Nếu gặp:

Chưa cấu hình Gemini API Key

Vào:

Cài đặt
→ Gemini API Key

và nhập API Key.

Lỗi Google Sheet 403

Nếu gặp:

403: The caller does not have permission

Kiểm tra:

Service Account JSON.
client_email.
Google Sheet URL.
Google Sheet đã Share cho Service Account chưa.
Service Account có quyền Editor chưa.
Lỗi không tìm thấy Google Sheet

Kiểm tra:

Google Sheet URL

và đảm bảo URL trỏ đến đúng file.

Lỗi Worksheet

Kiểm tra:

Google Sheet Name

Tên phải trùng với tên tab trong Google Sheet.

Ví dụ:

Sheet1

khác:

Business Cards
18. Cấu trúc thư mục

Source code:

ocr-business-card/
│
├── .venv/
│
├── data/
│   ├── settings.json
│   └── google_credentials.json
│
├── uploads/
│
├── schemas/
│   ├── __init__.py
│   └── business_card.py
│
├── services/
│   ├── gemini_service.py
│   └── google_sheet_service.py
│
├── static/
│   ├── script.js
│   └── style.css
│
├── templates/
│   └── index.html
│
├── config.py
├── main.py
├── run_app.py
├── requirements.txt
├── BusinessCardOCR.spec
├── .env
├── .env.example
└── README.md
19. Chạy phiên bản Source Code
Tạo Virtual Environment
python -m venv .venv
Kích hoạt
.\.venv\Scripts\Activate.ps1
Cài thư viện
pip install -r requirements.txt
Chạy ứng dụng
python run_app.py

Hoặc:

uvicorn main:app --reload

Sau đó truy cập:

http://127.0.0.1:8000
20. Đóng gói Windows EXE

Ứng dụng sử dụng PyInstaller để đóng gói.

Build:

pyinstaller --clean BusinessCardOCR.spec

Sau khi build thành công:

dist/
└── BusinessCardOCR/
    ├── BusinessCardOCR.exe
    ├── _internal/
    ├── templates/
    └── static/
21. Phân phối ứng dụng

Khi gửi cho người dùng khác, đóng gói toàn bộ thư mục:

BusinessCardOCR/

thành:

BusinessCardOCR.zip

Không nên chỉ gửi:

BusinessCardOCR.exe

vì ứng dụng cần các thư mục và thư viện đi kèm.

Người dùng chỉ cần:

Download ZIP
     ↓
Extract All
     ↓
Mở BusinessCardOCR
     ↓
Chạy BusinessCardOCR.exe
22. Bảo mật

Không commit hoặc chia sẻ các file chứa thông tin bí mật:

data/settings.json
data/google_credentials.json
.env

Đặc biệt không chia sẻ:

private_key
Gemini API Key

Nên thêm vào .gitignore:

.venv/
__pycache__/
*.pyc

.env

data/settings.json
data/google_credentials.json

uploads/

build/
dist/

*.spec.bak
23. Change Request (CR)
CR-01 — Business Card OCR
Mục tiêu

Tự động hóa quá trình nhập dữ liệu từ Business Card vào hệ thống quản lý dữ liệu.

Yêu cầu
Upload hình ảnh Business Card.
Hỗ trợ Business Card một mặt.
Hỗ trợ Business Card hai mặt.
OCR thông tin bằng AI.
Hiển thị kết quả OCR.
Cho phép chỉnh sửa kết quả.
Lưu dữ liệu vào Google Sheets.
Dữ liệu đầu ra
Name
Job Title
Company Vietnamese
Company English
TEL 1
TEL 2
Mobile 1
Mobile 2
Email 1
Email 2
Website
Address
Province
Country
Industry
Sector
CR-02 — Cấu hình Gemini
Yêu cầu

Cho phép người dùng nhập Gemini API Key trực tiếp trên giao diện.

Thay đổi

Không hard-code API Key trong source code.

API Key được lưu tại:

data/settings.json
CR-03 — Google Service Account
Yêu cầu

Không hard-code đường dẫn Credentials cố định.

Trước đây

Ứng dụng sử dụng đường dẫn Credentials cố định.

Sau khi thay đổi

Người dùng chọn file:

Google Service Account JSON

trên giao diện.

Backend lưu Credentials tại:

data/google_credentials.json
Lợi ích
Có thể thay đổi Credentials.
Không cần sửa source code.
Không cần cấu hình lại mỗi lần chạy.
Có thể phân phối ứng dụng cho nhiều người dùng.
CR-04 — Google Sheet Configuration

Cho phép người dùng cấu hình:

Google Sheet URL
Google Sheet Name

trên giao diện.

Không hard-code Google Sheet trong source code.

CR-05 — Kiểm tra kết nối

Thêm chức năng:

Test Google Sheet Connection

Mục đích:

Kiểm tra Credentials.
Kiểm tra quyền truy cập.
Kiểm tra Google Sheet URL.
Kiểm tra Worksheet.
CR-06 — Chỉnh sửa dữ liệu OCR

Cho phép người dùng chỉnh sửa dữ liệu sau khi OCR.

Quy trình:

OCR
 ↓
Review
 ↓
Edit
 ↓
Save

Nhằm hạn chế dữ liệu OCR sai được lưu trực tiếp vào hệ thống.

CR-07 — Đóng gói Windows

Đóng gói ứng dụng thành:

BusinessCardOCR.exe

Người dùng cuối không cần cài đặt Python để sử dụng.

24. API Endpoints

Backend cung cấp các endpoint chính:

Method	Endpoint	Chức năng
GET	/	Giao diện chính
POST	/upload-batch	Upload Business Card
GET	/card/{card_id}	Lấy thông tin Card
PUT	/card/{card_id}	Cập nhật Card
POST	/process/{card_id}	OCR Card
POST	/cards/{card_id}/save	Lưu vào Google Sheet
DELETE	/card/{card_id}	Xóa Card
GET	/api/settings	Lấy cấu hình
PUT	/api/settings	Lưu cấu hình
POST	/api/settings/google-credentials	Upload Credentials
POST	/api/settings/test-google-sheet	Test Google Sheet
GET	/api/health	Kiểm tra trạng thái hệ thống
25. Health Check

Có thể kiểm tra trạng thái ứng dụng:

GET /api/health

Kết quả cho biết:

Gemini đã cấu hình hay chưa.
Google Credentials đã cấu hình hay chưa.
Google Sheet đã cấu hình hay chưa.
Tên Google Sheet.
Số lượng Card hiện tại.
26. Lưu ý khi sử dụng
Ảnh danh thiếp

Nên sử dụng ảnh:

Rõ nét.
Không bị mờ.
Không bị nghiêng quá nhiều.
Đủ sáng.
Không che mất thông tin.
OCR

Luôn kiểm tra dữ liệu trước khi Save.

AI có thể nhận diện sai trong trường hợp:

Chữ quá nhỏ.
Ảnh bị mờ.
Font chữ đặc biệt.
Logo làm ảnh hưởng đến OCR.
Thông tin bị che khuất.
Ảnh thiếu sáng.
27. Quy trình vận hành đề xuất
                    START
                      │
                      ▼
              Mở BusinessCardOCR
                      │
                      ▼
             Kiểm tra cấu hình
                      │
          ┌───────────┴───────────┐
          │                       │
     Chưa cấu hình            Đã cấu hình
          │                       │
          ▼                       ▼
      Cài đặt                  Upload
          │                       │
          ▼                       ▼
    Gemini + Google           Process OCR
                                  │
                                  ▼
                              Review
                                  │
                         ┌────────┴────────┐
                         │                 │
                       Sai               Đúng
                         │                 │
                         ▼                 │
                      Edit                 │
                         │                 │
                         └────────┬────────┘
                                  ▼
                                Save
                                  │
                                  ▼
                            Google Sheet
                                  │
                                  ▼
                                 END
28. Phiên bản

Current version:

Business Card OCR v1.0.0
29. Tác giả

Business Card OCR

Developed with:

Python
FastAPI
Google Gemini
Google Sheets
HTML / CSS / JavaScript
30. License

Internal / Private Project.

Không sử dụng, sao chép hoặc phân phối source code cho mục đích khác nếu chưa được cho phép.
