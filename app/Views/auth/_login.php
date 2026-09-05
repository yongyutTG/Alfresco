<!doctype html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login | Alfresco</title>
    <link rel="stylesheet" href="<?= base_url('assets/css/app.css') ?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/2.1.4/toastr.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="auth-page">
    <main class="login-shell">
        <section class="login-hero"></section>

        <section class="login-panel">
            <div class="brand-block">
                <div class="brand-mark">A</div>
                <div>
                    <h2>ระบบ E-Documents Alfresco</h2>
                    <!-- <p>เข้าสู่ระบบด้วยบัญชี Alfresco เพื่อดูเอกสารตามสิทธิ์</p> -->
                </div>
            </div>

            <form id="loginForm" class="login-form" novalidate>
                <label>
                    <span>ชื่อผู้ใช้งาน</span>
                    <div class="login-input">
                        <input id="username" type="text" autocomplete="username" required autofocus>
                    </div>
                </label>

                <label>
                    <span>รหัสผ่าน</span>
                    <div class="login-input">
                        <input id="password" type="password" autocomplete="current-password" required>
                    </div>
                </label>

                <button type="submit" id="loginBtn">เข้าสู่ระบบ</button>
            </form>

            <p id="loginMessage" class="login-message" aria-live="polite"></p>

            <div class="app-version">
                Alfresco ci4 v<?= esc($appVersion) ?>
            </div>
        </section>
    </main>

    <script {csp-script-nonce}>
        window.AlfrescoDirect = {
            apiBaseUrl: <?= json_encode($apiBaseUrl) ?>,
            documentsUrl: <?= json_encode(site_url('documents')) ?>,
            idleTimeoutSeconds: <?= json_encode($idleTimeoutSeconds) ?>
        };
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/2.1.4/toastr.min.js"></script>
    <script src="<?= base_url('assets/js/direct-auth.js') ?>"></script>
</body>
</html>
