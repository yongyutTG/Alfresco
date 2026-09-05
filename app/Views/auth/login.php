<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login | UserAlfresco</title>
  <link rel="stylesheet" href="<?= base_url('assets/css/login.css') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/vendor/toastr/toastr.min.css') ?>">
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <main class="shell">
    <div class="brand">
      <!-- <div class="brand-mark">A</div> -->
      <h1>ระบบ E-Documents Alfresco</h1>
      <div class="subtitle">เข้าสู่ระบบด้วยบัญชี Alfresco เพื่อดูเอกสารตามสิทธิ์</div>
    </div>

    <section class="login-box">
      <div class="login-head">Alfresco Login</div>
      <form id="loginForm">
        <label for="username">ชื่อผู้ใช้</label>
        <input id="username" name="username" type="text" autocomplete="username" required autofocus>

        <label for="password">รหัสผ่าน</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required>

        <button type="submit" id="loginBtn">เข้าสู่ระบบ</button>
        <!-- <div class="hint">หลัง login สำเร็จ ระบบจะเก็บ accessToken ไว้ใน sessionStorage ของ browser แล้วพาไปหน้าไฟล์</div> -->
      </form>
       <p id="loginMessage" class="login-message" aria-live="polite"></p>
    </section>

    <div class="footer-link">
      v<?= esc($appVersion) ?>
    </div>
  </main>
      <script {csp-script-nonce}>
        window.AlfrescoDirect = {
            apiBaseUrl: <?= json_encode($apiBaseUrl) ?>,
            documentsUrl: <?= json_encode(site_url('documents')) ?>,
            idleTimeoutSeconds: <?= json_encode($idleTimeoutSeconds) ?>
        };
    </script>

   <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="<?= base_url('assets/vendor/toastr/toastr.min.js') ?>"></script>
    <script src="<?= base_url('assets/js/direct-auth.js') ?>"></script>
</body>
</html>
