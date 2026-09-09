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
GET http://localhost:3001/user-api/alfresco/documents/search
GET http://localhost:3001/user-api/alfresco/documents/location?id=DOCUMENT_ID
GET http://localhost:3001/user-api/alfresco/documents/:id/content
```

ทุกเส้นแนบ:

```http
Authorization: Bearer <accessToken>
```

## Document API Behavior

หน้า documents แยกการทำงานเป็น 2 แบบ:

```text
เลือก folder
-> list เอกสารใน folder ด้วย /documents

กดปุ่มค้นหา + ไม่กรอกคำค้น
-> ไม่ยิง API ค้นหา
-> แสดงข้อความให้กรอกคำค้นก่อน
-> รายการผลลัพธ์เดิมที่ได้จากการเลือก folder ยังแสดงอยู่

กดปุ่มล้าง
-> ลบคำค้น
-> ถ้ามี folder ที่เลือกอยู่ จะโหลดรายการเอกสารของ folder เดิมกลับมา
-> ถ้ายังไม่ได้เลือก folder จะกลับไปหน้าหลัก

กดปุ่มค้นหา + กรอกคำค้น
-> ค้นหาเอกสารด้วย /documents/search
```

เส้น list รายการเอกสาร ใช้ตอนเลือก folder หรือเปลี่ยนหน้า pagination:

```http
GET /user-api/alfresco/documents?folderPath=/Sites/tg-saving/documentLibrary&maxItems=17&skipCount=0
```

เส้นรายการเอกสารไม่ดึง `parentPath` อัตโนมัติ เพื่อให้โหลดเร็ว

การค้นหาชื่อไฟล์แบบแม่นใช้ endpoint แยก `/documents/search` พร้อม `exactName` หรือ `fileName`:

```http
GET /user-api/alfresco/documents/search?folderPath=/Sites/tg-saving/documentLibrary&exactName=23017_116969
```

API จะลองค้นชื่อแบบตรงตัวตามลำดับ:

```text
23017_116969
23017_116969.pdf
```

ถ้าหน้าเว็บค้น exact ไม่เจอ ปัจจุบันยัง fallback ไปค้นแบบใกล้เคียงด้วย `q` ที่ endpoint `/documents/search`:

```http
GET /user-api/alfresco/documents/search?folderPath=/Sites/tg-saving/documentLibrary&q=23017_116969
```

ตำแหน่งไฟล์แยกเป็น endpoint เฉพาะไฟล์:

```http
GET /user-api/alfresco/documents/location?id=DOCUMENT_ID
```

หมายเหตุ: ยังมี route เดิม `GET /user-api/alfresco/documents/:id/location` เพื่อรองรับโค้ดเก่า แต่หน้าเว็บใช้ query string เป็นหลัก เพราะ `id` ของ Alfresco บางตัวมีอักขระพิเศษที่ทำให้ path route จับไม่ตรงและอาจขึ้น `Route not found`

## Security Note

โปรเจคนี้เก็บ access token ใน browser `localStorage` เพื่อให้เห็น flow เรียก API ตรง ๆ ชัดเจน 
