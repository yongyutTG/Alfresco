# Alfresco Direct Frontend Flow

เอกสารนี้อธิบาย flow ของโปรเจค `Alfresco` ว่าแต่ละหน้าเรียกไฟล์ไหน และ JavaScript ยิง API เส้นไหนไปที่ `UserAlfresco-api`

## ภาพรวม

```text
Browser
 -> CI4 Alfresco แสดงหน้า login/documents
 -> JavaScript fetch ไป UserAlfresco-api โดยตรง
 -> UserAlfresco-api เรียก Alfresco Server
 -> ส่งผลลัพธ์กลับมาให้ Browser
```

โปรเจคนี้ใช้ CodeIgniter 4 เป็น frontend server สำหรับแสดงหน้าเว็บ ส่วน API ไม่ได้ยิงผ่าน Controller ของ CI4 แต่ยิงตรงจาก JavaScript ใน browser ไปที่ `UserAlfresco-api`

## 1. เข้าเว็บครั้งแรก

URL:

```text
GET http://localhost:8086/
```

ไฟล์ที่เกี่ยวข้อง:

```text
app/Config/Routes.php
app/Controllers/Home.php
```

ใน `app/Config/Routes.php`

```php
$routes->get('/', 'Home::index');
```

เมื่อเข้า `/` ระบบจะเรียก `Home::index()`

ใน `app/Controllers/Home.php`

```php
public function index()
{
    return redirect()->to('/login');
}
```

สรุป flow:

```text
/ 
 -> Home::index()
 -> redirect ไป /login
```

## 2. แสดงหน้า Login

URL:

```text
GET http://localhost:8086/login
```

ไฟล์ที่เกี่ยวข้อง:

```text
app/Config/Routes.php
app/Controllers/AuthController.php
app/Views/auth/login.php
public/assets/js/direct-auth.js
```

ใน `app/Config/Routes.php`

```php
$routes->get('login', 'AuthController::loginForm');
```

ใน `app/Controllers/AuthController.php`

```php
public function loginForm()
{
    return view('auth/login', [
        'apiBaseUrl' => rtrim((string) env('userAlfrescoApi.baseUrl', 'http://localhost:3001'), '/'),
    ]);
}
```

หน้าที่ของ `AuthController::loginForm()`

- อ่านค่า `userAlfrescoApi.baseUrl` จากไฟล์ `.env`
- ส่งค่า API URL ไปให้หน้า login
- render view `app/Views/auth/login.php`

ใน `app/Views/auth/login.php`

```js
window.AlfrescoDirect = {
    apiBaseUrl: "http://localhost:3001",
    documentsUrl: "http://localhost:8086/documents"
};
```

ค่า `window.AlfrescoDirect` จะถูกใช้ต่อใน `public/assets/js/direct-auth.js`

## 3. กด Login

ไฟล์ที่ทำงาน:

```text
public/assets/js/direct-auth.js
```

เมื่อกดปุ่ม login จะเข้า event:

```js
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    ...
});
```

JavaScript จะยิง API:

```text
POST http://localhost:3001/auth/login
```

Header:

```text
Content-Type: application/json
Accept: application/json
```

Body:

```json
{
  "username": "ชื่อผู้ใช้",
  "password": "รหัสผ่าน"
}
```

ถ้า login สำเร็จ `UserAlfresco-api` จะตอบกลับ `accessToken`

ตัวอย่าง response:

```json
{
  "tokenType": "Bearer",
  "accessToken": "TOKEN",
  "expiresInMs": 28800000,
  "username": "alfresco_user"
}
```

หน้า login มี 2 จุดที่เรียก `/auth/me`:

```text
1. ตอนเปิดหน้า login ถ้ามี token เก่าค้างใน localStorage จะเช็ค /auth/me ก่อน ถ้ายังใช้ได้ค่อย redirect ไป /documents
2. หลัง POST /auth/login สำเร็จ จะเช็ค /auth/me ด้วย token ใหม่ก่อน redirect ไป /documents
```

จากนั้น frontend จะเก็บข้อมูลไว้ใน browser:

```js
localStorage.setItem('alfresco_direct_access_token', data.accessToken);
localStorage.setItem('alfresco_direct_username', username);
localStorage.setItem('alfresco_direct_last_activity', String(Date.now()));
```

แล้ว redirect ไปหน้า documents:

```js
window.location.href = config.documentsUrl;
```

สรุป flow:

```text
login.php
 -> direct-auth.js
 -> ถ้ามี token เก่า: GET /auth/me
 -> POST /auth/login
 -> ได้ accessToken
 -> GET /auth/me เพื่อตรวจ token ใหม่
 -> เก็บ accessToken ใน localStorage
 -> redirect ไป /documents
```

## 4. แสดงหน้า Documents

URL:

```text
GET http://localhost:8086/documents
```

ไฟล์ที่เกี่ยวข้อง:

```text
app/Config/Routes.php
app/Controllers/DocumentController.php
app/Views/documents/index.php
public/assets/js/direct-documents.js
```

ใน `app/Config/Routes.php`

```php
$routes->get('documents', 'DocumentController::index');
```

ใน `app/Controllers/DocumentController.php`

```php
private string $rootPath = '/Sites/tg-saving/documentLibrary';

public function index()
{
    return view('documents/index', [
        'apiBaseUrl' => rtrim((string) env('userAlfrescoApi.baseUrl', 'http://localhost:3001'), '/'),
        'rootPath'   => $this->rootPath,
    ]);
}
```

หน้าที่ของ `DocumentController::index()`

- กำหนด root folder เริ่มต้นเป็น `/Sites/tg-saving/documentLibrary`
- อ่าน API base URL จาก `.env`
- render view `app/Views/documents/index.php`

ใน `app/Views/documents/index.php`

```js
window.AlfrescoDirect = {
    apiBaseUrl: "http://localhost:3001",
    rootPath: "/Sites/tg-saving/documentLibrary",
    loginUrl: "http://localhost:8086/login"
};
```

จากนั้นโหลดไฟล์:

```text
public/assets/js/direct-documents.js
```

## 5. ตรวจ Token ก่อนเข้า Documents

ไฟล์:

```text
public/assets/js/direct-documents.js
```

เมื่อเปิดหน้า documents จะเช็ค token จาก `localStorage`

```js
const token = localStorage.getItem(storage.accessToken);

if (!token) {
    window.location.href = config.loginUrl;
    return;
}
```

ถ้าไม่มี token จะถูกส่งกลับไปหน้า login

สรุป:

```text
/documents
 -> direct-documents.js
 -> เช็ค localStorage
 -> ถ้าไม่มี token กลับไป /login
 -> ถ้ามี token ใช้เรียก API ต่อ
```

## 6. โหลด Folder ตามสิทธิ์

ไฟล์:

```text
public/assets/js/direct-documents.js
```

Function ที่ทำงาน:

```js
loadFolders()
```

API ที่เรียก:

```text
GET http://localhost:3001/user-api/alfresco/folders?path=/Sites/tg-saving/documentLibrary
```

Header:

```text
Authorization: Bearer <accessToken>
Accept: application/json
```

หน้าที่:

- แสดง `หน้าหลัก` และ `คลังเอกสาร` ก่อน
- เรียก `/user-api/alfresco/folders/tree?path=<rootPath>` ครั้งเดียวตอนโหลดหน้า เพื่อโหลด folder หลักและ folder ย่อยทั้งหมดตามสิทธิ์
- ระหว่างโหลด tree จะแสดง loading state เฉพาะใน sidebar
- ยังไม่วนเรียก folder ย่อยเองจาก browser ทีละ path
- แสดงเฉพาะ folder ที่ user มีสิทธิ์เห็นตาม Alfresco
- หลังโหลด tree จะแสดงเฉพาะ folder หลักระดับแรกก่อน
- เมื่อ user กดแถบ folder หรือ chevron ของ folder หลัก จึงค่อยแสดง folder ย่อยใต้ folder นั้น โดยเยื้องตามระดับ
- ถ้า user กดแถบ folder หรือ chevron ซ้ำ จะปิด folder ย่อยใต้ folder นั้น
- ถ้า user กด `หน้าหลัก` จะปิด folder ย่อยทั้งหมด
- ถ้า user กดแถบ `คลังเอกสาร` จะโหลดเอกสารทั้งหมดในคลัง รวม folder ย่อยทุกชั้น
- folder ที่มีลูกจะแสดง chevron เพื่อบอกสถานะเปิด/ปิด
- จดจำ folder ล่าสุดไว้ใน `sessionStorage` และเปิดกลับมาที่ folder เดิมหลัง refresh หน้า
- มีปุ่ม `ปิดทั้งหมด` ใน sidebar สำหรับปิด folder ย่อยทั้งหมดโดยไม่ล้างผลเอกสาร

สรุป flow:

```text
direct-documents.js
 -> loadFolders()
 -> render ปุ่ม หน้าหลัก และ คลังเอกสาร
 -> GET /user-api/alfresco/folders/tree?path=<rootPath>
 -> render เฉพาะ folder หลักระดับแรก
 -> restore folder ล่าสุดจาก sessionStorage ถ้ามี
 -> user กดแถบ folder
 -> reveal/collapse folder ย่อยใต้ parent path ของตัวเอง
 -> GET /user-api/alfresco/documents?folderPath=<folderPath>
 -> user กด chevron
 -> reveal/collapse folder ย่อยใต้ parent path ของตัวเอง โดยไม่โหลดเอกสาร
 -> user กด หน้าหลัก
 -> collapse folder ย่อยทั้งหมด
```

## 7. เลือก Folder

ไฟล์:

```text
public/assets/js/direct-documents.js
```

Function ที่เกี่ยวข้อง:

```js
createFolderButton()
setSelectedFolder()
```

เมื่อ user คลิก folder:

```js
button.addEventListener('click', async () => {
    state.page = 1;
    setSelectedFolder(item.path);
    keywordInput.value = '';
    // folder tree ถูกโหลดตอนเข้า page แล้ว และแสดงเฉพาะ folder หลักก่อน
    // ถ้ากด chevron ให้ reveal/collapse folder ย่อย
    // ถ้ากดแถบ folder ให้ reveal/collapse folder ย่อย และโหลดเอกสารรวมลูกด้วย IN_TREE
    showLoadingSpinner();
    await loadDocuments({ allowList: true });
});
```

หน้าที่:

- เก็บ path folder ที่เลือกไว้ใน `state.folderPath`
- เปลี่ยนข้อความ Current Location
- อัปเดต breadcrumb ตาม path ปัจจุบัน เช่น `หน้าหลัก > คลังเอกสาร > การเงิน > 2567`
- breadcrumb แต่ละช่วงเป็นปุ่มย้อนกลับไปยังตำแหน่งนั้น
- ถ้าเลือก `หน้าหลัก` จะปิด folder ย่อยทั้งหมด และแสดงข้อความให้เลือก folder ก่อน
- ถ้ากด chevron ของ folder ที่มีลูก จะเปิด/ปิด folder ย่อยเท่านั้น
- ถ้ากดแถบ folder จะเปิด/ปิด folder ย่อยพร้อมกับโหลดเอกสารใน folder นั้นรวม folder ย่อยด้วย
- เมื่อเลือก folder จะบันทึก path ล่าสุดไว้ใน `sessionStorage`
- ถ้าไม่พบเอกสาร จะแสดง empty state ที่บอกว่าไม่พบเอกสารใน folder นี้ หรือไม่พบเอกสารที่ตรงกับคำค้น
- ระหว่างโหลดเอกสารจะแสดงข้อความเฉพาะเจาะจง เช่น `กำลังโหลดเอกสารใน การเงิน...`
- badge ใต้ชื่อ folder ถูกปิดไว้ก่อนเพื่อลดความซ้ำกับข้อความสถานะและ pagination
- ปุ่มหลักและปุ่มจัดการมี tooltip/title เพื่อบอกหน้าที่เมื่อเอาเมาส์ชี้

## 8. ค้นหา/แสดงรายการเอกสาร

ไฟล์:

```text
public/assets/js/direct-documents.js
```

Function หลัก:

```js
loadDocuments()
```

เมื่อกดปุ่มค้นหา form จะเช็คก่อนว่ามีคำค้นหรือไม่ ถ้ามีจึงเรียก `loadDocuments()`:

```js
searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!keywordInput.value.trim()) {
        setMessage('กรุณากรอกชื่อไฟล์หรือเลขที่เอกสารก่อนค้นหา', true);
        keywordInput.focus();
        return;
    }

    state.page = 1;
    loadDocuments();
});
```

### 8.1 กรณีไม่กรอกคำค้น

ถ้าเกิดจากการกดปุ่มค้นหา จะไม่มี API ที่เรียก และรายการเดิมที่ได้จากการเลือก folder จะยังแสดงอยู่

```text
กดค้นหา + ไม่กรอกคำค้น
 -> ไม่เรียก /user-api/alfresco/documents/search
 -> ไม่ล้างรายการผลลัพธ์เดิม
 -> แสดงข้อความให้กรอกชื่อไฟล์หรือเลขที่เอกสารก่อนค้นหา
```

ถ้าเกิดจากการเลือก folder หรือกด pagination จะเรียก list รายการด้วย `/documents`

```text
GET http://localhost:3001/user-api/alfresco/documents?folderPath=/Sites/tg-saving/documentLibrary&maxItems=25&skipCount=0
```

### 8.2 กรณีกรอกคำค้น

Function ที่ทำงาน:

```js
findExactThenPartial()
```

ระบบในหน้าเว็บจะค้น 2 รอบ

รอบที่ 1 ค้นชื่อไฟล์แบบตรงตัวก่อน:

```text
GET /user-api/alfresco/documents/search?folderPath=<folderPath>&exactName=<keyword>&maxItems=25&skipCount=0
```

ถ้า dev หรือหน้าเว็บส่ง `exactName=23017_116969` API จะค้นแบบแม่นโดยลองชื่อ:

```text
23017_116969
23017_116969.pdf
```

ถ้าเจอ จะหยุดและแสดงผลทันที

รอบที่ 2 ถ้าไม่เจอ exact หน้าเว็บปัจจุบันยัง fallback ไปค้นแบบใกล้เคียง:

```text
GET /user-api/alfresco/documents/search?folderPath=<folderPath>&q=<keyword>&maxItems=25&skipCount=0
```

เส้น `q` ใช้ `LIKE '%keyword%'` จึงอาจแสดงไฟล์ที่ชื่อใกล้เคียงได้

สรุป flow:

```text
กดค้นหา
 -> loadDocuments()
 -> ถ้าไม่มี keyword จะหยุด ไม่เรียก API และไม่ล้างผลลัพธ์เดิม
 -> ถ้ามี keyword จะเรียก findExactThenPartial()
 -> exactName ก่อน
 -> ถ้าไม่เจอค่อย q
 -> renderRows()
```

### 8.3 กรณีกดปุ่มล้าง

ปุ่มล้างจะลบคำค้นออกก่อน แล้วดูว่าอยู่ใน folder ไหน

```text
กดล้าง + มี folder ที่เลือกอยู่
 -> เรียก loadDocuments({ allowList: true })
 -> GET /user-api/alfresco/documents?folderPath=<folderPath>
 -> แสดงรายการเอกสารของ folder เดิมกลับมา

กดล้าง + ยังอยู่หน้าหลัก
 -> ไม่เรียก API เอกสาร
 -> แสดงข้อความให้เลือก folder
```

## 9. Render ตารางเอกสาร

ไฟล์:

```text
public/assets/js/direct-documents.js
```

Function:

```js
renderRows(items)
```

ข้อมูลที่แสดงในตาราง:

- ชื่อไฟล์
- ชนิดไฟล์
- ขนาดไฟล์
- ปุ่มรายละเอียดไฟล์
- ปุ่มเปิดไฟล์
- ปุ่มดาวน์โหลดไฟล์
- ปุ่มแก้ไขชื่อไฟล์ในคอลัมน์จัดการ

ปุ่มแก้ไขชื่อไฟล์จะแสดงเฉพาะไฟล์ที่ API ส่ง `allowRename: true` ถ้าไม่มีสิทธิ์แก้ไขชื่อไฟล์จะไม่แสดงไอคอนดินสอ

คอลัมน์ `ข้อมูลไฟล์` แสดงเป็นปุ่ม `รายละเอียด` เพื่อลดความแน่นของตาราง เมื่อกดแล้วเปิด modal แสดง:

- ชื่อไฟล์
- ขนาดไฟล์
- ผู้สร้าง
- วันที่สร้าง
- ผู้แก้ไขล่าสุด
- วันที่แก้ไขล่าสุด
- สิทธิ์แก้ไขชื่อไฟล์ผ่าน field `allowRename`
- ตำแหน่งไฟล์

ปุ่มเปิดไฟล์จะเก็บ:

```html
data-id="DOCUMENT_ID"
data-name="FILE_NAME"
```

ตำแหน่งไฟล์ใน modal รายละเอียดจะเรียก API แยกเฉพาะไฟล์นั้น เพื่อไม่ให้รายการหลักโหลดช้า:

```text
GET http://localhost:3001/user-api/alfresco/documents/location?id=DOCUMENT_ID
```

เมื่อกดปุ่มรายละเอียด backend จะบันทึก audit log action `VIEW_FILE_DETAIL`

หน้าเว็บใช้ query string แทนการใส่ `id` ไว้ใน path เพื่อเลี่ยงปัญหา `Route not found` เมื่อ `id` ของ Alfresco มีอักขระพิเศษ ส่วน route เดิม `/user-api/alfresco/documents/:id/location` ยังมีไว้รองรับโค้ดเก่า

ตัวอย่าง response:

```json
{
  "id": "DOCUMENT_ID",
  "parentPath": "/Sites/tg-saving/documentLibrary/การเงิน",
  "source": "nodes-api"
}
```

ถ้าหาตำแหน่งไม่ได้ API จะตอบ `parentPath: null` และ modal จะแสดงข้อความว่าไม่พบข้อมูลตำแหน่งไฟล์

## 10. แก้ไขชื่อไฟล์

ไฟล์:

```text
app/Views/documents/index.php
public/assets/js/direct-documents.js
public/assets/css/app.css
```

UI:

```text
กดไอคอนดินสอในคอลัมน์จัดการ
 -> แสดงเฉพาะเมื่อ `allowRename: true`
 -> เปิด modal แก้ไขชื่อไฟล์
 -> แสดงชื่อไฟล์เดิม
 -> กรอกชื่อหลักใหม่โดยไม่ต้องพิมพ์นามสกุลไฟล์
 -> ระบบเติมนามสกุลเดิมก่อนส่ง API
 -> กดบันทึก หรือ Enter
```

API ที่เรียก:

```text
PATCH http://localhost:3001/user-api/alfresco/documents?id=DOCUMENT_ID
```

หน้าเว็บส่ง id ผ่าน query string เพื่อเก็บ id เต็มของ Alfresco เช่น `uuid;1.0` และเลี่ยงปัญหา `Route not found` จากอักขระพิเศษใน URL path

Body:

```json
{
  "name": "new-file-name.pdf"
}
```

Validation ฝั่งหน้าเว็บ:

```text
ชื่อไฟล์ต้องไม่ว่าง
ชื่อไฟล์ต้องไม่มี / หรือ \
ถ้าชื่อใหม่เหมือนชื่อเดิม จะไม่ยิง API
```

หลังบันทึกสำเร็จ:

```text
PATCH rename สำเร็จ
 -> เคลียร์คำค้น
 -> state.page = 1
 -> loadDocuments({ allowList: true, refresh: true })
 -> โหลดรายการของ folder ปัจจุบันใหม่
 -> ปิด modal แก้ไขชื่อไฟล์
 -> แสดงข้อความสำเร็จ
```

`refresh: true` จะเพิ่ม query `_=<timestamp>` ตอนเรียก list documents เพื่อช่วยกัน response เก่าค้างจาก cache/proxy:

```text
GET /user-api/alfresco/documents?folderPath=<folderPath>&maxItems=25&skipCount=0&_=<timestamp>
```

## 11. เปิดไฟล์ PDF

ไฟล์:

```text
public/assets/js/direct-documents.js
```

Function:

```js
openFile(id, name)
```

API ที่เรียก:

```text
GET http://localhost:3001/user-api/alfresco/documents/:id/content?name=file.pdf
```

ตัวอย่าง:

```text
GET http://localhost:3001/user-api/alfresco/documents/7b815e16-a594-4864-9665-cfda64e8d880%3B1.0/content?name=file.pdf
```

Header:

```text
Authorization: Bearer <accessToken>
```

เนื่องจาก browser ไม่สามารถ `window.open()` แล้วแนบ `Authorization` header ได้โดยตรง จึงต้องใช้ `fetch()` ก่อน:

```js
const response = await fetch(url, {
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const blob = await response.blob();
const objectUrl = URL.createObjectURL(blob);
window.open(objectUrl, '_blank', 'noopener');
```

ดังนั้นเวลาหน้า PDF เปิดขึ้นมา URL จะเป็นลักษณะนี้:

```text
blob:http://localhost:8086/xxxx
```

อันนี้เป็นพฤติกรรมปกติของ frontend ที่เรียก API ตรงพร้อม Bearer token

## 11.1 ดาวน์โหลดไฟล์

ไฟล์:

```text
public/assets/js/direct-documents.js
```

Function:

```js
downloadFile(id, name)
```

API ที่เรียก:

```text
GET http://localhost:3001/user-api/alfresco/documents/:id/content?name=file.pdf&action=download
```

ต่างจากปุ่มเปิดไฟล์ตรงที่เพิ่ม `action=download` เพื่อให้ backend บันทึก audit log เป็น `DOWNLOAD_FILE` ส่วนปุ่มเปิดไฟล์จะไม่ส่ง `action=download` และถูกบันทึกเป็น `OPEN_FILE`

## 12. Logout

ไฟล์:

```text
public/assets/js/direct-documents.js
```

Function:

```js
logout()
```

การทำงาน:

```js
await notifyBackendLogout();
clearStoredSession();
window.location.href = config.loginUrl;
```

`notifyBackendLogout()` จะเรียก:

```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

สรุป:

```text
กด Logout
 -> POST /auth/logout ไป UserAlfresco-api พร้อม Bearer token
 -> backend บันทึก audit log action LOGOUT
 -> ลบ accessToken จาก localStorage
 -> ลบ username จาก localStorage
 -> ลบ lastActivity จาก localStorage
 -> redirect ไป /login
```

หมายเหตุ: ถ้าปิด browser/tab เฉย ๆ หรือ frontend ลบ token เองโดยไม่เรียก `/auth/logout` backend จะไม่สามารถบันทึก `LOGOUT` ได้

## 13. API ที่ frontend เรียก

Frontend เรียก `UserAlfresco-api` โดยตรงทั้งหมด

| Flow | Method | Endpoint | Token |
|---|---|---|---|
| Login | `POST` | `/auth/login` | ไม่ต้องแนบ |
| Check token | `GET` | `/auth/me` | Bearer token |
| Logout | `POST` | `/auth/logout` | Bearer token |
| Load folders | `GET` | `/user-api/alfresco/folders?path=...` | Bearer token |
| Load documents | `GET` | `/user-api/alfresco/documents?folderPath=...` | Bearer token |
| Search exact name | `GET` | `/user-api/alfresco/documents/search?folderPath=...&exactName=...` | Bearer token |
| Search partial | `GET` | `/user-api/alfresco/documents/search?folderPath=...&q=...` | Bearer token |
| Get file location | `GET` | `/user-api/alfresco/documents/location?id=...` | Bearer token |
| Rename file | `PATCH` | `/user-api/alfresco/documents?id=...` | Bearer token |
| Open content | `GET` | `/user-api/alfresco/documents/:id/content?name=...` | Bearer token |
| Download content | `GET` | `/user-api/alfresco/documents/:id/content?name=...&action=download` | Bearer token |

## 14. Token อยู่ที่ไหน

Token ถูกเก็บไว้ใน browser:

```text
localStorage key: alfresco_direct_access_token
```

Username ถูกเก็บไว้ใน browser:

```text
localStorage key: alfresco_direct_username
```

ไฟล์ที่ใช้ token:

```text
public/assets/js/direct-documents.js
```

Function ที่แนบ token:

```js
function authHeaders(extraHeaders = {}) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...extraHeaders,
    };
}
```

## 14. สรุป Logic จากไฟล์ไปไฟล์

```text
app/Config/Routes.php
 -> กำหนด URL /, /login, /documents

app/Controllers/Home.php
 -> redirect / ไป /login

app/Controllers/AuthController.php
 -> render app/Views/auth/login.php
 -> ส่ง apiBaseUrl ไปให้ JavaScript

app/Views/auth/login.php
 -> แสดงฟอร์ม login
 -> สร้าง window.AlfrescoDirect
 -> โหลด public/assets/js/direct-auth.js

public/assets/js/direct-auth.js
 -> รับ username/password
 -> POST /auth/login ไป UserAlfresco-api
 -> เก็บ accessToken ใน localStorage
 -> redirect ไป /documents

app/Controllers/DocumentController.php
 -> render app/Views/documents/index.php
 -> ส่ง apiBaseUrl และ rootPath ไปให้ JavaScript

app/Views/documents/index.php
 -> แสดง layout หน้า documents
 -> สร้าง window.AlfrescoDirect
 -> โหลด public/assets/js/direct-documents.js

public/assets/js/direct-documents.js
 -> เช็ค token
 -> โหลด folder ตามสิทธิ์
 -> เลือก folder แล้วโหลดเอกสารทันที
 -> ค้นหา exactName ก่อน ถ้าไม่เจอค่อย q
 -> ดูรายละเอียดไฟล์ผ่าน modal และโหลดตำแหน่งไฟล์ด้วย endpoint แยก
 -> เปิดไฟล์ด้วย fetch + blob
 -> logout
```


