(function () {
    const config = window.AlfrescoDirect;
    const storage = {
        accessToken: 'alfresco_direct_access_token',
        username: 'alfresco_direct_username',
    };
    const token = localStorage.getItem(storage.accessToken);

    if (!token) {
        window.location.href = config.loginUrl;
        return;
    }

    const state = {
        folderPath: config.rootPath,
        page: 1,
        hasMoreItems: false,
    };

    const folderList = document.getElementById('folderList');
    const selectedFolder = document.getElementById('selectedFolder');
    const folderPathInput = document.getElementById('folderPath');
    const searchForm = document.getElementById('searchForm');
    const keywordInput = document.getElementById('keyword');
    const pageSizeInput = document.getElementById('pageSize');
    const rows = document.getElementById('documentRows');
    const message = document.getElementById('message');
    const resultCount = document.getElementById('resultCount');
    const pageInfo = document.getElementById('pageInfo');
    const firstBtn = document.getElementById('firstBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const clearBtn = document.getElementById('clearBtn');
    const reloadFoldersBtn = document.getElementById('reloadFoldersBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    const savedUsername = localStorage.getItem(storage.username) || '-';
    userName.textContent = savedUsername;
    userAvatar.textContent = savedUsername.charAt(0).toUpperCase() || 'A';

    function apiUrl(path) {
        return `${config.apiBaseUrl}${path}`;
    }

    function authHeaders(extraHeaders = {}) {
        return {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            ...extraHeaders,
        };
    }

    function setMessage(text, isError) {
        message.textContent = text;
        message.closest('.summary-strip')?.classList.toggle('error', Boolean(isError));
    }

    function setSelectedFolder(path) {
        state.folderPath = path;
        folderPathInput.value = path;
        selectedFolder.textContent = path;

        document.querySelectorAll('.folder-item').forEach((button) => {
            button.classList.toggle('active', button.dataset.path === path);
        });
    }

    async function requestJson(path) {
        const response = await fetch(apiUrl(path), {
            headers: authHeaders(),
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            logout();
            throw new Error('Session หมดอายุ กรุณา login ใหม่');
        }

        if (!response.ok) {
            throw new Error(data.message || 'เรียก API ไม่สำเร็จ');
        }

        return data;
    }

    function pickItems(payload) {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.items)) return payload.items;
        if (Array.isArray(payload.files)) return payload.files;
        if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;
        if (payload.data && Array.isArray(payload.data.files)) return payload.data.files;
        return [];
    }

    async function loadFolders() {
        setMessage('กำลังโหลด folder ตามสิทธิ์...');
        folderList.innerHTML = '';

        const url = new URL('/user-api/alfresco/folders', config.apiBaseUrl);
        url.searchParams.set('path', config.rootPath);
        const payload = await requestJson(`${url.pathname}${url.search}`);
        const items = pickItems(payload).filter((item) => item.isFolder || item.type === 'cmis:folder');

        folderList.appendChild(createFolderButton({
            name: 'documentLibrary',
            path: config.rootPath,
        }));
        items.forEach((item) => folderList.appendChild(createFolderButton(item)));
        setSelectedFolder(state.folderPath);
        setMessage('เลือก folder แล้วกดค้นหาเพื่อแสดงเอกสาร');
    }

    function createFolderButton(item) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'folder-item';
        button.dataset.path = item.path;
        button.innerHTML = `
            <span class="folder-name">${escapeHtml(item.name || item.path)}</span>
            <span class="folder-path">${escapeHtml(item.path || '')}</span>
        `;
        button.addEventListener('click', () => {
            state.page = 1;
            setSelectedFolder(item.path);
            rows.innerHTML = '';
            resultCount.textContent = '0';
            setMessage('เลือก folder แล้ว กดค้นหาเพื่อดึงเอกสาร');
            updatePager(false);
        });

        return button;
    }

    async function loadDocuments() {
        const maxItems = Number(pageSizeInput.value || 100);
        const skipCount = (state.page - 1) * maxItems;
        const keyword = keywordInput.value.trim();

        setMessage('กำลังดึงเอกสาร...');
        rows.innerHTML = '';
        updatePager(true);

        let payload;
        if (keyword) {
            payload = await findExactThenPartial(keyword, maxItems, skipCount);
        } else {
            const url = new URL('/user-api/alfresco/documents', config.apiBaseUrl);
            url.searchParams.set('folderPath', state.folderPath);
            url.searchParams.set('maxItems', String(maxItems));
            url.searchParams.set('skipCount', String(skipCount));
            payload = await requestJson(`${url.pathname}${url.search}`);
        }

        const items = pickItems(payload).filter((item) => item.isDocument !== false && item.type !== 'cmis:folder');
        state.hasMoreItems = Boolean(payload.hasMoreItems);

        renderRows(items);
        resultCount.textContent = String(items.length);
        updatePager(false);
        setMessage(items.length ? `${payload.message ? `${payload.message} ` : ''}พบเอกสาร ${items.length} รายการ` : 'ไม่พบเอกสาร');
    }

    async function findExactThenPartial(keyword, maxItems, skipCount) {
        const exactUrl = new URL('/user-api/alfresco/documents', config.apiBaseUrl);
        exactUrl.searchParams.set('folderPath', state.folderPath);
        exactUrl.searchParams.set('exactName', keyword);
        exactUrl.searchParams.set('maxItems', String(maxItems));
        exactUrl.searchParams.set('skipCount', String(skipCount));
        const exactPayload = await requestJson(`${exactUrl.pathname}${exactUrl.search}`);

        if (pickItems(exactPayload).length) {
            exactPayload.message = 'พบจากการค้นชื่อไฟล์เต็ม';
            return exactPayload;
        }

        const partialUrl = new URL('/user-api/alfresco/documents', config.apiBaseUrl);
        partialUrl.searchParams.set('folderPath', state.folderPath);
        partialUrl.searchParams.set('q', keyword);
        partialUrl.searchParams.set('maxItems', String(maxItems));
        partialUrl.searchParams.set('skipCount', String(skipCount));
        const partialPayload = await requestJson(`${partialUrl.pathname}${partialUrl.search}`);
        partialPayload.message = 'ไม่พบชื่อไฟล์เต็ม จึงค้นแบบบางส่วนแทน';
        return partialPayload;
    }

    function renderRows(items) {
        if (!items.length) {
            rows.innerHTML = '<tr><td colspan="4" class="muted">ไม่มีข้อมูล</td></tr>';
            return;
        }

        rows.innerHTML = items.map((item) => {
            const id = escapeHtml(item.id || '');
            const name = escapeHtml(item.name || '-');
            const openName = escapeHtml(item.name || 'file.pdf');

            return `
                <tr>
                    <td>
                        <div class="file-name">${name}</div>
                        <div class="file-meta">ผู้สร้าง: ${escapeHtml(item.createdBy || '-')} · วันที่สร้าง: ${escapeHtml(formatDate(item.creationDate))}</div>
                    </td>
                    <td><span class="file-badge">${escapeHtml(item.mimeType || '-')}</span></td>
                    <td>${formatSize(item.size)}</td>
                    <td><button type="button" class="open-link open-file-btn" data-id="${id}" data-name="${openName}">เปิดไฟล์</button></td>
                </tr>
            `;
        }).join('');
    }

    async function openFile(id, name) {
        const url = apiUrl(`/user-api/alfresco/documents/${encodeURIComponent(id)}/content?name=${encodeURIComponent(name || 'file.pdf')}`);
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`เปิดไฟล์ไม่สำเร็จ: HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank', 'noopener');
    }

    function updatePager(isLoading) {
        pageInfo.textContent = `หน้า ${state.page}`;
        firstBtn.disabled = isLoading || state.page <= 1;
        prevBtn.disabled = isLoading || state.page <= 1;
        nextBtn.disabled = isLoading || !state.hasMoreItems;
    }

    function logout() {
        localStorage.removeItem(storage.accessToken);
        localStorage.removeItem(storage.username);
        window.location.href = config.loginUrl;
    }

    function formatSize(bytes) {
        const value = Number(bytes || 0);
        if (!value) return '-';
        if (value < 1024) return `${value} B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
        return `${(value / 1024 / 1024).toFixed(1)} MB`;
    }

    function formatDate(value) {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        state.page = 1;
        loadDocuments().catch((error) => {
            setMessage(error.message, true);
            updatePager(false);
        });
    });

    clearBtn.addEventListener('click', () => {
        keywordInput.value = '';
        state.page = 1;
        rows.innerHTML = '';
        resultCount.textContent = '0';
        setMessage('ล้างคำค้นแล้ว กดค้นหาเพื่อดึงเอกสาร');
        updatePager(false);
    });

    reloadFoldersBtn.addEventListener('click', () => loadFolders().catch((error) => setMessage(error.message, true)));
    logoutBtn.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });

    rows.addEventListener('click', (event) => {
        const button = event.target.closest('.open-file-btn');
        if (!button) return;
        openFile(button.dataset.id, button.dataset.name).catch((error) => setMessage(error.message, true));
    });

    firstBtn.addEventListener('click', () => {
        state.page = 1;
        loadDocuments().catch((error) => setMessage(error.message, true));
    });

    prevBtn.addEventListener('click', () => {
        state.page = Math.max(1, state.page - 1);
        loadDocuments().catch((error) => setMessage(error.message, true));
    });

    nextBtn.addEventListener('click', () => {
        state.page += 1;
        loadDocuments().catch((error) => setMessage(error.message, true));
    });

    setSelectedFolder(config.rootPath);
    updatePager(false);
    loadFolders().catch((error) => setMessage(error.message, true));
})();
