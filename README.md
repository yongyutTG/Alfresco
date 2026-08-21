# Alfresco Direct CI4 Frontend

โปรเจค CI4 frontend ที่เรียก `UserAlfresco-api` ตรงจาก browser

```text
Browser
 -> UserAlfresco-api
 -> Alfresco
```

ต่างจาก `AlfrescoDocuments`:

```text
Browser
 -> CI4 proxy
 -> UserAlfresco-api
 -> Alfresco
```

## Pages

```text
GET /login
GET /documents
```

CI4 ใช้เสิร์ฟหน้าเท่านั้น ไม่มี proxy API

## Run

```bash
php spark serve --port 8086
```

เปิด:

```text
http://localhost:8086/login
```

## Direct API Calls ตรงๆเลย

หน้า login:

```http
POST http://localhost:3001/auth/login
Content-Type: application/json
```

หน้า documents:

```http
GET http://localhost:3001/user-api/alfresco/folders
GET http://localhost:3001/user-api/alfresco/documents
GET http://localhost:3001/user-api/alfresco/documents/:id/content
```

ทุกเส้นแนบ:

```http
Authorization: Bearer <accessToken>
```

## Security Note

โปรเจคนี้เก็บ access token ใน browser `localStorage` เพื่อให้เห็น flow เรียก API ตรง ๆ ชัดเจน 