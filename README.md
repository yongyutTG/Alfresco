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

GET http://localhost:3001/auth/me
Authorization: Bearer <accessToken>
```

`/auth/me` ใช้ตรวจ token เก่าที่ค้างใน browser และตรวจ token ใหม่หลัง login ก่อน redirect ไปหน้า documents

หน้า documents:

```http
GET http://localhost:3001/user-api/alfresco/folders
GET http://localhost:3001/user-api/alfresco/documents
GET http://localhost:3001/user-api/alfresco/documents/search
GET http://localhost:3001/user-api/alfresco/documents/location?id=DOCUMENT_ID
GET http://localhost:3001/user-api/alfresco/documents/versions?id=DOCUMENT_ID
PATCH http://localhost:3001/user-api/alfresco/documents?id=DOCUMENT_ID
PUT http://localhost:3001/user-api/alfresco/documents/content?id=DOCUMENT_ID&name=file.pdf
DELETE http://localhost:3001/user-api/alfresco/documents?id=DOCUMENT_ID
POST http://localhost:3001/auth/logout
GET http://localhost:3001/user-api/alfresco/documents/:id/content
GET http://localhost:3001/user-api/alfresco/documents/:id/content?name=file.pdf&action=download
```

ทุกเส้นยกเว้น `/auth/login` ต้องแนบ:

```http
Authorization: Bearer <accessToken>
```

## Document API Behavior

## Header และ Sidebar UI

หน้า documents ใช้โลโก้สหกรณ์จาก `public/images/logo_coop.png` แบบเดียวกับโปรเจค PcDetail โดยหัวเว็บแสดง:

```text
สหกรณ์ออมทรัพย์พนักงานบริษัท การบินไทย จำกัด
เป็นสหกรณ์ออมทรัพย์ที่มั่นคง โปร่งใส ก้าวไกลด้วยเทคโนโลยี เอื้ออาทรต่อสมาชิกและสังคม
```

ค่าหลักของหัวเว็บ:

```text
โลโก้หน้า documents: 42x42px
ชื่อบริษัท: 16px สี #3d216b
subtitle: 10px สี #3d216b
```

กล่องผู้ใช้งานด้านขวาแสดงเป็น profile block มีไอคอนผู้ใช้ในวงกลม ข้อความ `ยินดีต้อนรับ` และชื่อจาก `localStorage` key `alfresco_direct_username`

sidebar ยังใช้วิธีลากปรับความกว้างด้วย resize handle เท่านั้น ไม่มีปุ่มย่อ/ขยายเมนูแล้ว ค่าความกว้างถูกจำไว้ใน `localStorage` key `alfresco_direct_sidebar_width`

```text
sidebar min width: 220px
sidebar default width: 300px
sidebar max width: 360px
```

Toast และ message:

```text
toastr ใช้แจ้งผล action ชั่วคราว เช่น แก้ไขชื่อไฟล์ อัปเดตไฟล์ และลบไฟล์
success toast แสดง 4 วินาที
error toast แสดง 6 วินาที
message bar ใช้สำหรับสถานะหลักของหน้า เช่น กำลังโหลด, กรุณาเลือก folder, ไม่พบข้อมูล
```

ขนาด modal ฝั่ง documents:

```text
modal แก้ไขชื่อไฟล์ / อัปเดตไฟล์ / ลบไฟล์
-> title 18px
-> icon 40x40px
-> body, label, input, button 13px

modal รายละเอียดไฟล์
-> title 18px
-> icon 40x40px
-> tab และข้อมูลหลัก 13px
-> metadata รองในประวัติเวอร์ชัน 12px
```

หน้า documents แยกการทำงานเป็น 2 แบบ:

```text
โหลดหน้า documents
-> แสดง หน้าหลัก และ คลังเอกสาร ก่อน
-> เรียก /folders/tree ครั้งเดียว เพื่อโหลด folder หลักและ folder ย่อยทั้งหมดตามสิทธิ์
-> ระหว่างโหลดจะแสดงสถานะ loading เฉพาะใน sidebar
-> หลังโหลด tree จะแสดงเฉพาะ folder หลักก่อน ส่วน folder ย่อยจะแสดงเมื่อ user กดแถบ folder หรือ chevron
-> ถ้ากด หน้าหลัก จะปิด folder ย่อยทั้งหมด
-> ถ้ากด คลังเอกสาร จะโหลดเอกสารทั้งหมดในคลัง รวม folder ย่อยทุกชั้น
-> folder ที่มีลูกจะแสดง chevron เปิด/ปิด
-> จำ folder ล่าสุดใน sessionStorage และเปิดกลับมาที่ folder เดิมหลัง refresh หน้า

เลือก folder
-> กดแถบ folder จะเปิด/ปิด folder ย่อยพร้อมกับ list เอกสารใน folder นั้นด้วย /documents โดยรวมเอกสารใน folder ย่อยด้วย
-> กด chevron จะเปิด/ปิด folder ย่อยเท่านั้น ไม่โหลดเอกสาร
-> ถ้าไม่พบเอกสาร จะแสดง empty state ว่าไม่พบเอกสารใน folder นี้หรือไม่พบเอกสารที่ตรงกับคำค้น
-> ระหว่างโหลดเอกสารจะแสดงข้อความเฉพาะเจาะจง เช่น กำลังโหลดเอกสารใน การเงิน...
-> badge ใต้ชื่อ folder ถูกปิดไว้ก่อนเพื่อลดความซ้ำกับข้อความสถานะและ pagination
-> breadcrumb จะแสดงตำแหน่งตามลำดับ เช่น หน้าหลัก > คลังเอกสาร > การเงิน > 2567
-> breadcrumb แต่ละช่วงคลิกย้อนกลับไปยังตำแหน่งนั้นได้
-> ปุ่มหลักและปุ่มจัดการมี tooltip/title เพื่อบอกหน้าที่เมื่อเอาเมาส์ชี้

กดปุ่มค้นหา + ไม่กรอกคำค้น
-> ไม่ยิง API ค้นหา
-> แสดงข้อความให้กรอกคำค้นก่อน
-> รายการผลลัพธ์เดิมที่ได้จากการเลือก folder ยังแสดงอยู่

กดปุ่มล้าง
-> ลบเฉพาะข้อความในช่องค้นหา
-> focus กลับไปที่ช่องค้นหา
-> ไม่ reload เอกสาร
-> ไม่ล้างผลลัพธ์เดิม
-> ไม่เปลี่ยน folder หรือ pagination

กดปุ่มค้นหา + กรอกคำค้น
-> ค้นหาเอกสารด้วย /documents/search
```

เส้น list รายการเอกสาร ใช้ตอนเลือก folder หรือเปลี่ยนหน้า pagination:

```http
GET /user-api/alfresco/documents?folderPath=/Sites/tg-saving/documentLibrary&maxItems=25&skipCount=0
```

เส้นรายการเอกสารไม่ดึง `parentPath` อัตโนมัติ เพื่อให้โหลดเร็ว

คอลัมน์ `ข้อมูลไฟล์` ในตารางแสดงเป็นปุ่ม `รายละเอียด` เมื่อกดแล้วเปิด modal โดยใช้ข้อมูล:

```text
name
size
createdBy
creationDate
lastModifiedBy
lastModificationDate
allowRename สำหรับควบคุมการแสดงไอคอนแก้ไขชื่อไฟล์
parentPath จาก endpoint /documents/location ซึ่ง backend จะบันทึก audit action `VIEW_FILE_DETAIL`
```

modal รายละเอียดไฟล์แบ่งเป็น 2 แท็บ:

```text
ข้อมูลไฟล์
-> แสดงชื่อไฟล์ ขนาด ผู้สร้าง วันที่สร้าง ผู้แก้ไขล่าสุด วันที่แก้ไขล่าสุด และตำแหน่งไฟล์

ประวัติเวอร์ชัน
-> เรียก /documents/versions?id=DOCUMENT_ID
-> แสดงเวอร์ชัน วันที่แก้ไข ผู้แก้ไข ขนาด comment และปุ่มเปิด/ดาวน์โหลดเวอร์ชันนั้น
```

modal รายละเอียดไฟล์ใช้ font scale เดียวกับ modal อัปเดตไฟล์ เพื่อให้สอดคล้องกับหน้า documents โดย tab และข้อมูลหลักอยู่ที่ `13px`

สิทธิ์แก้ไขแสดงทางคอลัมน์ `จัดการ` เท่านั้น ถ้า API ส่ง `allowRename: true` จะแสดงไอคอนดินสอ ถ้าไม่มีสิทธิ์จะไม่แสดงไอคอนนี้

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

ตำแหน่งไฟล์แยกเป็น endpoint เฉพาะไฟล์ และ backend จะบันทึก audit action `VIEW_FILE_DETAIL`:

```http
GET /user-api/alfresco/documents/location?id=DOCUMENT_ID
```

หมายเหตุ: ยังมี route เดิม `GET /user-api/alfresco/documents/:id/location` เพื่อรองรับโค้ดเก่า แต่หน้าเว็บใช้ query string เป็นหลัก เพราะ `id` ของ Alfresco บางตัวมีอักขระพิเศษที่ทำให้ path route จับไม่ตรงและอาจขึ้น `Route not found`

การแก้ไขชื่อไฟล์เริ่มจากกดไอคอนดินสอในคอลัมน์ `จัดการ` จากนั้นหน้าเว็บจะเปิด modal แก้ชื่อ ผู้ใช้แก้เฉพาะชื่อหลักได้โดยไม่ต้องพิมพ์นามสกุลไฟล์ ระบบจะรักษานามสกุลเดิมไว้แล้วเรียก API:

ไอคอนดินสอจะแสดงเฉพาะไฟล์ที่ API ส่ง `allowRename: true` เท่านั้น ถ้า user ไม่มีสิทธิ์แก้ไขชื่อไฟล์ หน้าเว็บจะไม่แสดงไอคอนนี้ แต่ backend ยังต้องตรวจสิทธิ์จริงตอนเรียก PATCH เสมอ

```http
PATCH /user-api/alfresco/documents?id=DOCUMENT_ID
Content-Type: application/json
```

```json
{
  "name": "new-file-name.pdf"
}
```

หลังบันทึกสำเร็จ หน้าเว็บจะเคลียร์คำค้น กลับไปหน้า 1 แล้วโหลดรายการเอกสารของ folder ปัจจุบันใหม่ด้วย `loadDocuments({ allowList: true, refresh: true })` เพื่อให้เห็นชื่อใหม่ทันที

หน้าเว็บส่ง id ผ่าน query string เพื่อเก็บ id เต็มของ Alfresco เช่น `uuid;1.0` และเลี่ยงปัญหา `Route not found` จากอักขระพิเศษใน URL path

## Update, Delete และ Version History

คอลัมน์ `จัดการ` มี action เพิ่มเติม:

```text
Update ไฟล์
-> เปิด modal เลือกไฟล์ใหม่
-> ส่งไฟล์แบบ binary ไปที่ PUT /user-api/alfresco/documents/content?id=DOCUMENT_ID&name=file.pdf
-> เป็นการแทนที่เนื้อหา/สร้าง version ใหม่ของเอกสารเดิม ไม่เปลี่ยนชื่อเอกสาร
-> หลังสำเร็จจะ reload รายการเอกสารใน folder เดิม

ลบไฟล์
-> เปิด modal ยืนยันก่อนลบ
-> เรียก DELETE /user-api/alfresco/documents?id=DOCUMENT_ID
-> หลังสำเร็จจะ reload รายการเอกสารใน folder เดิม
```

ผลลัพธ์ของ action `แก้ไขชื่อไฟล์`, `อัปเดตไฟล์` และ `ลบไฟล์` แจ้งด้วย toastr เท่านั้น ไม่เปลี่ยน message bar เพื่อไม่ให้สถานะหลักของหน้า documents ถูกแทนด้วยข้อความชั่วคราว

ปุ่ม `Update` และ `ลบ` แสดงในคอลัมน์ `จัดการ` ตามสิทธิ์ที่ API ส่งกลับมา เช่น `allowUpdate`, `allowDelete`, `canUpdate`, `canDelete` หรือ fallback จาก `allowRename` ใน UI ทดลองปัจจุบัน แต่ backend ยังต้องตรวจสิทธิ์จริงจาก Alfresco เสมอ

ประวัติเวอร์ชันดึงผ่าน endpoint:

```http
GET /user-api/alfresco/documents/versions?id=DOCUMENT_ID
```

หน้าเว็บแสดงรายการในแท็บ `ประวัติเวอร์ชัน` ภายใน modal รายละเอียดไฟล์ เพื่อไม่ให้ modal ล้นจอ และปุ่มเปิด/ดาวน์โหลดเวอร์ชันจะใช้ `objectId` ของเวอร์ชันนั้นเรียก endpoint content เดิม


## Logout และ Audit Log

เมื่อ user กด logout หน้าเว็บจะเรียก backend ก่อนล้าง token:

```http
POST http://localhost:3001/auth/logout
Authorization: Bearer <accessToken>
```

จากนั้นจึงลบข้อมูลใน browser:

```text
localStorage key: alfresco_direct_access_token
localStorage key: alfresco_direct_username
localStorage key: alfresco_direct_last_activity
```

เหตุผลที่ต้องเรียก `/auth/logout` ก่อนล้าง token คือให้ `UserAlfresco-api` บันทึก audit log action `LOGOUT` ลง `backend/logs/audit.log` ได้ ถ้าลบ token ฝั่ง browser อย่างเดียว backend จะไม่รู้ว่า user logout
## Security Note

โปรเจคนี้เก็บ access token ใน browser `localStorage` เพื่อให้เห็น flow เรียก API ตรง ๆ ชัดเจน 

