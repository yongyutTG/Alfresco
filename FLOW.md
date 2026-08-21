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
  "accessToken": "TOKEN",
  "expiresAt": "..."
}
```

จากนั้น frontend จะเก็บข้อมูลไว้ใน browser:

```js
localStorage.setItem('alfresco_direct_access_token', data.accessToken);
localStorage.setItem('alfresco_direct_username', username);
```

แล้ว redirect ไปหน้า documents:

```js
window.location.href = config.documentsUrl;
```

สรุป flow:

```text
login.php
 -> direct-auth.js
 -> POST /auth/login
 -> ได้ accessToken
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

- ดึง folder ใต้ `/Sites/tg-saving/documentLibrary`
- แสดงเฉพาะ folder ที่ user มีสิทธิ์เห็นตาม Alfresco
- นำ folder มาแสดงใน sidebar ด้านซ้าย

สรุป flow:

```text
direct-documents.js
 -> loadFolders()
 -> GET /user-api/alfresco/folders
 -> render ปุ่ม folder ด้านซ้าย
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
button.addEventListener('click', () => {
    state.page = 1;
    setSelectedFolder(item.path);
    rows.innerHTML = '';
    resultCount.textContent = '0';
    setMessage('เลือก folder แล้ว กดค้นหาเพื่อดึงเอกสาร');
    updatePager(false);
});
```

หน้าที่:

- เก็บ path folder ที่เลือกไว้ใน `state.folderPath`
- เปลี่ยนข้อความ Current Location
- ยังไม่โหลดเอกสารทันที
- ต้องกดปุ่มค้นหาก่อนถึงจะเรียก API เอกสาร

## 8. ค้นหา/แสดงรายการเอกสาร

ไฟล์:

```text
public/assets/js/direct-documents.js
```

Function หลัก:

```js
loadDocuments()
```

เมื่อกดปุ่มค้นหา form จะเรียก:

```js
searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    state.page = 1;
    loadDocuments();
});
```

### 8.1 กรณีไม่กรอกคำค้น

API ที่เรียก:

```text
GET http://localhost:3001/user-api/alfresco/documents?folderPath=/Sites/tg-saving/documentLibrary&maxItems=100&skipCount=0
```

Query parameters:

| Parameter | ความหมาย |
|---|---|
| `folderPath` | path ของ folder ที่เลือก |
| `maxItems` | จำนวนรายการต่อหน้า |
| `skipCount` | จำนวนรายการที่ข้าม ใช้สำหรับ pagination |

Header:

```text
Authorization: Bearer <accessToken>
Accept: application/json
```

### 8.2 กรณีกรอกคำค้น

Function ที่ทำงาน:

```js
findExactThenPartial()
```

ระบบจะค้น 2 รอบ

รอบที่ 1 ค้นชื่อเต็มก่อน:

```text
GET /user-api/alfresco/documents?folderPath=<folderPath>&exactName=<keyword>&maxItems=100&skipCount=0
```

ถ้าเจอ จะหยุดและแสดงผลทันที

รอบที่ 2 ถ้าไม่เจอชื่อเต็ม จะค้นแบบบางส่วน:

```text
GET /user-api/alfresco/documents?folderPath=<folderPath>&q=<keyword>&maxItems=100&skipCount=0
```

สรุป flow:

```text
กดค้นหา
 -> loadDocuments()
 -> ถ้ามี keyword
    -> findExactThenPartial()
    -> exactName ก่อน
    -> ถ้าไม่เจอค่อย q
 -> renderRows()
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
- ผู้สร้าง
- วันที่สร้าง
- ชนิดไฟล์
- ขนาดไฟล์
- ปุ่มเปิดไฟล์

ปุ่มเปิดไฟล์จะเก็บ:

```html
data-id="DOCUMENT_ID"
data-name="FILE_NAME"
```

## 10. เปิดไฟล์ PDF

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

## 11. Logout

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
localStorage.removeItem(storage.accessToken);
localStorage.removeItem(storage.username);
window.location.href = config.loginUrl;
```

สรุป:

```text
กด Logout
 -> ลบ accessToken จาก localStorage
 -> ลบ username จาก localStorage
 -> redirect ไป /login
```

## 12. API ที่ frontend เรียก

Frontend เรียก `UserAlfresco-api` โดยตรงทั้งหมด

| Flow | Method | Endpoint | Token |
|---|---|---|---|
| Login | `POST` | `/auth/login` | ไม่ต้องแนบ |
| Load folders | `GET` | `/user-api/alfresco/folders?path=...` | Bearer token |
| Load documents | `GET` | `/user-api/alfresco/documents?folderPath=...` | Bearer token |
| Search exact name | `GET` | `/user-api/alfresco/documents?folderPath=...&exactName=...` | Bearer token |
| Search partial | `GET` | `/user-api/alfresco/documents?folderPath=...&q=...` | Bearer token |
| Open content | `GET` | `/user-api/alfresco/documents/:id/content?name=...` | Bearer token |

## 13. Token อยู่ที่ไหน

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
 -> เลือก folder
 -> กดค้นหาแล้วโหลดเอกสาร
 -> เปิดไฟล์ด้วย fetch + blob
 -> logout
```

