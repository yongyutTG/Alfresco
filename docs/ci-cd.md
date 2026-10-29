# CI/CD Alfresco

ใช้รูปแบบเดียวกับ PcDetail: GitHub Actions ตรวจ PR/push เข้า `main` บน hosted runner และ deploy เฉพาะ push หลังผ่าน tests บน Linux self-hosted runner

## ขั้นตอนที่ pipeline ตรวจ

- Composer validation และติดตั้ง dependencies จาก lock file
- PHP syntax ใน `app/` และ `tests/` และ JavaScript syntax ใน `public/assets/js/`
- PHPUnit บน PHP 8.4 พร้อม SQLite สำหรับ tests
- JavaScript regression tests ทุกไฟล์ `tests/*.test.cjs` และ `tests/javascript/*.test.cjs` บน Node.js 22

## ตั้งค่าเซิร์ฟเวอร์ครั้งแรก

1. ใน GitHub repository `yongyutTG/Alfresco` เปิด Settings → Actions → Runners → New self-hosted runner แล้วติดตั้ง Linux runner ด้วยคำสั่งและ token ที่ GitHub แสดง ให้รันเป็น service และเพิ่ม label `alfresco-production` runner ต้องเข้าถึง repository นี้ได้; runner ที่ผูกกับ repository PcDetail อย่างเดียวจะรับงาน Alfresco ไม่ได้
2. เตรียม checkout ของ `https://github.com/yongyutTG/Alfresco.git` ที่ `/var/www/html/Alfresco` ให้บัญชี runner เป็นเจ้าของและมีสิทธิ์ fetch จาก origin เก็บ checkout นี้แยกจาก runner workspace และไม่แก้ไฟล์ tracked บน server
3. ติดตั้ง PHP 8.4 CLI/FPM, Composer 2 ที่ `/usr/local/bin/composer` และ extensions ตาม `composer.lock` รวม `intl`, `mbstring`, `fileinfo` ตรวจด้วย `php8.4 /usr/local/bin/composer check-platform-reqs --no-dev` หลังติดตั้ง dependencies
4. สร้าง `.env` บน server โดยตั้ง `CI_ENVIRONMENT = production`, `app.baseURL` เป็น URL จริง และ `userAlfrescoApi.baseUrl` เป็น API URL ที่ browser ของผู้ใช้เข้าถึงได้ ตั้งค่า CORS ที่ API ให้ยอมรับ frontend origin และตรวจ CSP ให้ตรงกับ endpoint ที่ใช้งาน ไม่ commit `.env`
5. ตั้ง Nginx document root เป็น `/var/www/html/Alfresco/public` และ PHP socket ของ `php8.4-fpm` ให้ FPM และ runner เขียน `writable/` และโฟลเดอร์ย่อยที่ใช้งานได้
6. ให้บัญชี runner ใช้ sudo แบบไม่ถามรหัสผ่านเฉพาะคำสั่ง `nginx -t`, `systemctl restart php8.4-fpm`, `systemctl reload nginx` โดยตรวจ absolute path ของ executable บน server ก่อนกำหนด sudoers
7. นำไฟล์ CI/CD ขึ้น `main` หลังตั้งค่าข้างต้นแล้ว ตรวจผลใน GitHub Actions และเปิด `/login`, `/documents` เพื่อทดสอบกับ API จริง

Workflow เลือก runner labels `[self-hosted, Linux, alfresco-production]` เพื่อไม่ให้ deploy ไปเครื่องอื่นโดยบังเอิญ ใช้ PHP 8.4 ตาม PcDetail โดยไม่ได้เปลี่ยน requirement ของแอปที่รองรับ PHP 8.2 ขึ้นไป

## พฤติกรรม deploy

`build/deploy.sh` ตรวจ checkout, `.env`, PHP, Nginx และ writable ก่อน fetch/reset ไปยัง commit ที่ผ่าน CI แล้วติดตั้ง production dependencies และ restart PHP-FPM/reload Nginx คง `.env` และข้อมูล ignored ใน `writable/` ไว้ ไม่ใช้ `git clean` และไม่ทำ database migration; browser ยังเรียก UserAlfresco-api โดยตรง

ค่าเริ่มต้น override ได้ผ่าน environment ของ runner: `DEPLOY_DIR`, `PHP_BIN`, `COMPOSER_BIN` โดย PHP ต้องเป็น 8.4.x และ service ยังคงเป็น `php8.4-fpm` หาก server ใช้ stack อื่นให้ปรับสคริปต์ก่อนเปิด deploy

Deploy ทำทีละงานและข้าม commit ที่ถูกแทนที่โดย main รุ่นใหม่แล้ว เป็นการอัปเดตใน directory เดิม ไม่ใช่ atomic deployment; หาก Composer หรือ service ล้มเหลวให้ตรวจ Actions log และกู้ checkout พร้อม vendor จาก backup ที่ตรงกัน การ restart PHP-FPM มีผลกับเว็บอื่นที่ใช้ service เดียวกันด้วย

สำรอง checkout, vendor และ `.env` ก่อน deploy ครั้งแรก การ rollback ต้องคืนทั้งโค้ดและ dependencies ให้ตรงกัน ทดสอบ API/login จริงหลัง deploy เพราะ regression tests ไม่ได้เรียก Alfresco จริง
