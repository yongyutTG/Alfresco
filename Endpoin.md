# รายการ API Endpoint ของโปรเจค Alfresco

ตรวจสอบจากซอร์สโค้ดวันที่ 28 ตุลาคม 2026

โปรเจคมีการเรียก API **22 เส้นทางหลัก และ 2 เส้นทางสำรอง รวม 24 เส้นทาง** โดยนับแยกตาม **HTTP Method + Path** เช่น `GET /documents` กับ `POST /documents` ถือเป็นคนละเส้น และไม่นับค่าพารามิเตอร์ที่เปลี่ยนไปเป็นเส้นใหม่

ระบบเรียก `UserAlfresco-api` จาก JavaScript ในเบราว์เซอร์โดยตรง ส่วน CodeIgniter 4 ใช้แสดงหน้าเว็บ โดย Base URL มาจากค่า `userAlfrescoApi.baseUrl` ใน `.env` เส้นทางในตารางเป็นเส้นทางต่อจาก Base URL

## 1. เข้าสู่ระบบและออกจากระบบ — 3 เส้น

อ้างอิง: [direct-auth.js](public/assets/js/direct-auth.js) และส่วนออกจากระบบใน [direct-documents.js](public/assets/js/direct-documents.js)

| # | Method | API | หน้าที่ |
|---|---|---|---|
| 1 | POST | `/auth/login` | ส่ง `username` และ `password` เพื่อเข้าสู่ระบบ แล้วนำ `accessToken` ที่ได้รับไปเก็บใน `localStorage` |
| 2 | GET | `/auth/me` | ตรวจสอบว่า Token ยังใช้งานได้ เรียกทั้งเมื่อตรวจพบ Token เดิมและหลัง Login สำเร็จ |
| 3 | POST | `/auth/logout` | แจ้ง API เมื่อออกจากระบบ จากนั้นฝั่งเบราว์เซอร์ล้างข้อมูลการเข้าสู่ระบบ |

## 2. ข้อมูลระบบและสิทธิ์ — 2 เส้น

อ้างอิง: [direct-documents.js](public/assets/js/direct-documents.js)

| # | Method | API | หน้าที่ |
|---|---|---|---|
| 4 | GET | `/user-api/system/info` | ดึง `serverTime`, `timezone` และ `serverName` เพื่อแสดงข้อมูลเซิร์ฟเวอร์และปรับเวลาที่แสดงบนหน้าเว็บ |
| 5 | GET | `/user-api/alfresco/permissions?id={id}` | ดึงรายละเอียดสิทธิ์ของโฟลเดอร์ที่เลือก เพื่อนำมาแสดงในเมนูสิทธิ์ |

## 3. จัดการโฟลเดอร์ — 5 เส้น

อ้างอิง: [direct-documents.js](public/assets/js/direct-documents.js) และ [direct-bulk.js](public/assets/js/direct-bulk.js)

| # | Method | API | หน้าที่ |
|---|---|---|---|
| 6 | GET | `/user-api/alfresco/folders/tree?path={rootPath}` | ดึงโครงสร้างโฟลเดอร์ใต้ตำแหน่งเริ่มต้น เพื่อนำมาแสดงเป็นต้นไม้โฟลเดอร์ |
| 7 | POST | `/user-api/alfresco/folders` | สร้างโฟลเดอร์ใหม่ โดยส่ง `parentPath` และ `name` |
| 8 | PATCH | `/user-api/alfresco/folders/{id}` | เปลี่ยนชื่อโฟลเดอร์ด้วย `name` หรือย้ายโฟลเดอร์ด้วย `targetFolderPath` |
| 9 | DELETE | `/user-api/alfresco/folders/{id}?recursive={true/false}` | ลบโฟลเดอร์ รองรับการลบแบบรวมรายการภายใน โดยกรณี `recursive=true` ส่ง `confirmName` เพื่อยืนยันชื่อ |
| 10 | POST | `/user-api/alfresco/folders/bulk-move` | ย้ายหลายโฟลเดอร์พร้อมกัน โดยส่งรายการ `folders` และ `targetFolderPath` |

## 4. จัดการเอกสาร — 12 เส้น

อ้างอิง: [direct-documents.js](public/assets/js/direct-documents.js), [direct-upload.js](public/assets/js/direct-upload.js) และ [direct-bulk.js](public/assets/js/direct-bulk.js)

| # | Method | API | หน้าที่ |
|---|---|---|---|
| 11 | GET | `/user-api/alfresco/documents` | ดึงรายการเอกสารใน `folderPath` รองรับแบ่งหน้าด้วย `maxItems`, `skipCount` และเรียงลำดับด้วย `sortBy`, `sortDirection` |
| 12 | GET | `/user-api/alfresco/documents/search` | ค้นหาเอกสาร โดยค้นชื่อแบบตรงกันผ่าน `exactName` ก่อน หากไม่พบจึงค้นแบบใกล้เคียงผ่าน `q` |
| 13 | POST | `/user-api/alfresco/documents` | อัปโหลดเอกสารใหม่ ส่ง `FormData` ซึ่งมี `folderPath` และ `file` โดยส่งทีละไฟล์ |
| 14 | PATCH | `/user-api/alfresco/documents?id={id}` | เปลี่ยนชื่อเอกสาร โดยส่ง JSON `{ name }` |
| 15 | PUT | `/user-api/alfresco/documents/content?id={id}&name={name}` | อัปเดตเนื้อหาเอกสารเดิม โดยส่งข้อมูลไฟล์ใหม่เป็น Request Body |
| 16 | DELETE | `/user-api/alfresco/documents?id={id}` | ลบเอกสารจากคำสั่งลบไฟล์รายตัว |
| 17 | DELETE | `/user-api/alfresco/documents/{id}` | ใช้เมื่อลบเอกสารหลายรายการ โดยเรียกทีละไฟล์ตามลำดับและตรวจสอบผลแต่ละรายการ |
| 18 | GET | `/user-api/alfresco/documents/{id}/content` | ดึงเนื้อหาไฟล์เป็น Blob เพื่อเปิดดูหรือดาวน์โหลด มีพารามิเตอร์ `name` และ `action` ตามการใช้งาน |
| 19 | POST | `/user-api/alfresco/documents/bulk-download` | ส่งรายการ `documents` ที่เลือก เพื่อดาวน์โหลดหลายไฟล์เป็น ZIP |
| 20 | GET | `/user-api/alfresco/documents/location?id={id}` | ดึงตำแหน่งจัดเก็บเอกสาร ใช้แสดงข้อมูลตำแหน่งและเปิดโฟลเดอร์ที่เก็บไฟล์ |
| 21 | GET | `/user-api/alfresco/documents/versions?id={id}` | ดึงประวัติเวอร์ชันของเอกสารมาแสดงในหน้ารายละเอียดไฟล์ |
| 22 | POST | `/user-api/alfresco/documents/bulk-move` | ย้ายเอกสารหลายรายการ โดยส่งรายการ `documents` และ `targetFolderPath` |

## 5. เส้นทางสำรอง — 2 เส้น

สองเส้นนี้จะเรียกเมื่อเส้นทางหลักของ Location หรือ Versions ตอบกลับเป็น **HTTP 404** เท่านั้น

อ้างอิง: ฟังก์ชัน `requestFileLocation()` และ `requestFileVersions()` ใน [direct-documents.js](public/assets/js/direct-documents.js)

| # | Method | API | หน้าที่ |
|---|---|---|---|
| 23 | GET | `/user-api/alfresco/documents/{id}/location` | เส้นทางสำรองสำหรับดึงตำแหน่งเอกสารของข้อ 20 |
| 24 | GET | `/user-api/alfresco/documents/{id}/versions` | เส้นทางสำรองสำหรับดึงประวัติเวอร์ชันของข้อ 21 |

## โค้ดเก่าที่ไม่นับรวมในหน้าเว็บปัจจุบัน

มีโค้ดใน [UserAlfrescoApiClient.php](app/Libraries/UserAlfrescoApiClient.php) ที่เรียก `GET /user-api/alfresco/folders?path=...` เพิ่มอีกหนึ่งเส้น สำหรับดึงรายการโฟลเดอร์ แต่ไม่พบการนำ Library นี้มาใช้ใน Controller ปัจจุบัน จึงไม่นับรวมใน 24 เส้นของหน้าเว็บปัจจุบัน หากรวมเส้นที่พบในโค้ดเก่าด้วย จะเป็น **25 เส้นที่ไม่ซ้ำกัน**

เส้นทางอื่นใน Library ได้แก่ `POST /auth/login`, `GET /user-api/alfresco/documents` และ `GET /user-api/alfresco/documents/{id}/content` ซ้ำกับรายการข้างต้น จึงไม่เพิ่มจำนวน

## ขอบเขตการตรวจสอบ

- ตรวจสอบจากซอร์สโค้ด ไม่ได้ยิง API จริงเพื่อยืนยันการตอบกลับของแต่ละเส้น
- จำนวนนี้หมายถึง Endpoint ที่พบการเรียกใน Frontend ไม่ใช่จำนวน API ทั้งหมดที่ Backend รองรับ
- หน้า `/login` และ `/documents` เป็นเส้นทางหน้าเว็บของ CI4 จึงไม่นับเป็น API ในรายการนี้
- การตรวจสอบเดิมไม่ได้แก้ไขโค้ดโปรเจค เอกสารนี้บันทึกผลการตรวจสอบดังกล่าว
