(function () {
    const config = window.AlfrescoDirect;
    const storage = {
        accessToken: 'alfresco_direct_access_token',
        username: 'alfresco_direct_username',
    };

    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const message = document.getElementById('loginMessage');

    if (localStorage.getItem(storage.accessToken)) {
        window.location.href = config.documentsUrl;
        return;
    }

    function showToast(text, isError) {
        if (!window.toastr) {
            return;
        }

        window.toastr.options = {
            closeButton: true,
            progressBar: true,
            positionClass: 'toast-top-center',
            timeOut: '3500',
        };

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

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        // console.log('Username:', username);
        // console.log('Password:', password);
        if (!username) {
            setMessage('กรุณากรอกชื่อผู้ใช้งาน', true);
            usernameInput.focus();
            return;
        }

        if (!password) {
            setMessage('กรุณากรอกรหัสผ่าน', true);
            passwordInput.focus();
            return;
        }

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
                window.location.href = config.documentsUrl;
            } else {
                setMessage(data.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', true);
                resetLoginButton();
            }
        } catch (error) {
            setMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', true);
            resetLoginButton();
        }
    });
})();
