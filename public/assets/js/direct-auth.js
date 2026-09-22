(function () {
    const config = window.AlfrescoDirect;
    const storage = {
        accessToken: 'alfresco_direct_access_token',
        username: 'alfresco_direct_username',
        lastActivity: 'alfresco_direct_last_activity',
        sessionMessage: 'alfresco_direct_session_message',
    };
    const idleTimeoutMs = Number(config.idleTimeoutSeconds || 0) * 1000;

    //สร้างตัวแปลงสำหรับเก็บค่าของฟอร์มและปุ่มต่าง ๆ
    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const message = document.getElementById('loginMessage');

    configureToastr();

    if (hasIdleExpired()) {
        clearStoredSession();
        sessionStorage.setItem(storage.sessionMessage, 'Session หมดอายุ เนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่');
    }

    const existingToken = localStorage.getItem(storage.accessToken);
    if (existingToken) {
        verifyExistingToken(existingToken);
    }

    async function verifyExistingToken(existingToken) {
        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${existingToken}`,
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                localStorage.setItem(storage.lastActivity, String(Date.now()));
                window.location.href = config.documentsUrl;
                return;
            }
        } catch (error) {
            // ถ้าเช็ค token ไม่ได้ ให้ถือว่า token เก่าใช้ไม่ได้ แล้วให้ user login ใหม่
        }

        clearStoredSession();
        sessionStorage.removeItem(storage.sessionMessage);
    }

    function hasIdleExpired() {
        const lastActivity = Number(localStorage.getItem(storage.lastActivity) || 0);
        return idleTimeoutMs > 0 && lastActivity > 0 && Date.now() - lastActivity > idleTimeoutMs;
    }

    function clearStoredSession() {
        localStorage.removeItem(storage.accessToken);
        localStorage.removeItem(storage.username);
        localStorage.removeItem(storage.lastActivity);
    }

    async function ensureTokenUsable(accessToken) {
        const response = await fetch(`${config.apiBaseUrl}/auth/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Token ใช้งานไม่ได้ กรุณา login ใหม่');
        }
    }

    function configureToastr() {
        if (!window.toastr) {
            return;
        }

        window.toastr.options = {
             closeButton: true,
             progressBar: true,
            //  positionClass: 'toast-center-center',
            timeOut: '3500',
        };
    }

    function showToast(text, isError) {
        if (!window.toastr) {
            return;
        }

        if (isError) {
            window.toastr.error(text, 'แจ้งเตือน');
        } else {
            window.toastr.info(text);
        }
    }

    function setMessage(text, isError) {
        if (message) {
            message.textContent = text;
            message.classList.toggle('text-danger', Boolean(isError));
        }

        showToast(text, isError);
    }

    function resetLoginButton() {
        loginBtn.disabled = false;
        loginBtn.textContent = 'เข้าสู่ระบบ';
    }

    function showStoredSessionMessage() {
        const text = sessionStorage.getItem(storage.sessionMessage);

        if (!text) {
            return;
        }

        sessionStorage.removeItem(storage.sessionMessage);
        setMessage(text, true);
    }

    showStoredSessionMessage();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        // console.log('Username:', username);
        // console.log('Password:', password);
        if (username === "") {
               //setMessage('กรุณากรอกชื่อผู้ใช้งาน', true);
                showToast("กรุณากรอกชื่อผู้ใช้", true);
                usernameInput.focus();
                return;
            } else if (password === "") {
                // setMessage('กรุณากรอกรหัสผ่าน', true);
                showToast("กรุณากรอกรหัสผ่าน", true);
                passwordInput.focus();
                return;
            }
        clearStoredSession();
        sessionStorage.removeItem(storage.sessionMessage);

        loginBtn.disabled = true;
        loginBtn.textContent = 'กำลังเข้าสู่ระบบ...';

        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json().catch(() => ({}));
            // console.log('Login Response Data:', data);

            if (response.ok && data.accessToken) {
                localStorage.setItem(storage.accessToken, data.accessToken);
                localStorage.setItem(storage.username, username);
                localStorage.setItem(storage.lastActivity, String(Date.now()));
                await ensureTokenUsable(data.accessToken);
                setTimeout(() => window.location.href = config.documentsUrl, 1000);
            } else {
                showToast("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง", true);
                // setMessage(data.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', true);
                resetLoginButton();
            }
        } catch (error) {
            showToast("เกิดข้อผิดพลาดในการเข้าสู่ระบบ", true);
            // setMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', true);
            resetLoginButton();
        }
    });
})();
