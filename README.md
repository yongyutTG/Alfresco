# Alfresco Direct CI4 Frontend

โปรเจค CI4 frontend ที่เรียก `UserAlfresco-api` ตรงจาก browser

```text
Browser
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
GET http://localhost:3001/user-api/alfresco/documents/:id/location
GET http://localhost:3001/user-api/alfresco/documents/:id/content
```

ทุกเส้นแนบ:

```http
Authorization: Bearer <accessToken>
```

## Document API Behavior

รายการเอกสารหลักใช้เส้นนี้:

```http
GET /user-api/alfresco/documents?folderPath=/Sites/tg-saving/documentLibrary&maxItems=17&skipCount=0
```

เส้นรายการเอกสารไม่ดึง `parentPath` อัตโนมัติ เพื่อให้โหลดเร็ว

การค้นหาชื่อไฟล์แบบแม่นใช้ `exactName` หรือ `fileName`:

```http
GET /user-api/alfresco/documents?folderPath=/Sites/tg-saving/documentLibrary&exactName=23017_116969
```

API จะลองค้นชื่อแบบตรงตัวตามลำดับ:

```text
23017_116969
23017_116969.pdf
```

ถ้าหน้าเว็บค้น exact ไม่เจอ ปัจจุบันยัง fallback ไปค้นแบบใกล้เคียงด้วย `q`:

```http
GET /user-api/alfresco/documents?folderPath=/Sites/tg-saving/documentLibrary&q=23017_116969
```

ตำแหน่งไฟล์แยกเป็น endpoint เฉพาะไฟล์:

```http
GET /user-api/alfresco/documents/:id/location
```

## Security Note

โปรเจคนี้เก็บ access token ใน browser `localStorage` เพื่อให้เห็น flow เรียก API ตรง ๆ ชัดเจน 
