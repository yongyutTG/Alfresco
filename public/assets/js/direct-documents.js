(function () {
    const config = window.AlfrescoDirect;
    const storage = {
        accessToken: 'alfresco_direct_access_token',
        username: 'alfresco_direct_username',
        lastActivity: 'alfresco_direct_last_activity',
        sessionMessage: 'alfresco_direct_session_message',
    };
    const idleTimeoutMs = Number(config.idleTimeoutSeconds || 0) * 1000;
    let lastActivityWrite = 0;
    let sessionExpired = false;

    const token = localStorage.getItem(storage.accessToken);

    if (!token) {
        window.location.href = config.loginUrl;
        return;
    }

    const state = {
        folderPath: config.rootPath,
        page: 1,
        hasMoreItems: false,
        pageSize: 100,
        totalItems: 0,
        currentItemCount: 0,
        hasKnownTotal: false,
        nameSortDirection: 'asc',
    };

    const folderList = document.getElementById('folderList');
    const selectedFolder = document.getElementById('selectedFolder');
    const folderPathInput = document.getElementById('folderPath');
    const searchForm = document.getElementById('searchForm');
    const keywordInput = document.getElementById('keyword');
    const pageSizeInput = document.getElementById('pageSize');
    const rows = document.getElementById('documentRows');
    const sortNameBtn = document.getElementById('sortNameBtn');
    const message = document.getElementById('message');
    const resultCount = document.getElementById('resultCount');
    const pageInfo = document.getElementById('pageInfo');
    const pageRangeInfo = document.getElementById('pageRangeInfo');
    const firstBtn = document.getElementById('firstBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const lastBtn = document.getElementById('lastBtn');
    const clearBtn = document.getElementById('clearBtn');
    const reloadFoldersBtn = document.getElementById('reloadFoldersBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const sessionTimeoutModal = document.getElementById('sessionTimeoutModal');
    const sessionTimeoutMessage = document.getElementById('sessionTimeoutMessage');
    const sessionTimeoutOkBtn = document.getElementById('sessionTimeoutOkBtn');
    const logoutConfirmModal = document.getElementById('logoutConfirmModal');
    const logoutConfirmBtn = document.getElementById('logoutConfirmBtn');
    const logoutCancelBtn = document.getElementById('logoutCancelBtn');

    const savedUsername = localStorage.getItem(storage.username) || '-';
    userName.textContent = savedUsername;
    userAvatar.textContent = savedUsername.charAt(0).toUpperCase() || 'A';

    if (hasIdleExpired()) {
        expireSession();
        return;
    }

    markActivity(true);
    startIdleTimeout();

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

    function hasIdleExpired() {
        const lastActivity = Number(localStorage.getItem(storage.lastActivity) || 0);
        return idleTimeoutMs > 0 && lastActivity > 0 && Date.now() - lastActivity > idleTimeoutMs;
    }

    function markActivity(force = false) {
        if (sessionExpired) {
            return;
        }

        const now = Date.now();

        if (!force && now - lastActivityWrite < 30000) {
            return;
        }

        lastActivityWrite = now;
        localStorage.setItem(storage.lastActivity, String(now));
    }

    function startIdleTimeout() {
        if (idleTimeoutMs <= 0) {
            return;
        }

        ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach((eventName) => {
            window.addEventListener(eventName, () => markActivity(), { passive: true });
        });

        window.setInterval(() => {
            if (hasIdleExpired()) {
                expireSession();
            }
        }, 10000);
    }

    function expireSession() {
        logout('Session หมดอายุ เนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่', true);
    }

    function forceLogoutByApi() {
        logout('Session หมดอายุ กรุณา login ใหม่');
    }

    function setMessage(text, isError) {
        if (!message) {
            return;
        }

        message.textContent = text;
        message.closest('.summary-strip')?.classList.toggle('error', Boolean(isError));
    }

    function setResultCount(count) {
        if (resultCount) {
            resultCount.textContent = String(count);
        }
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
        if (hasIdleExpired()) {
            expireSession();
            throw new Error('Session หมดอายุ กรุณา login ใหม่');
        }

        const response = await fetch(apiUrl(path), {
            headers: authHeaders(),
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            forceLogoutByApi();
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

    function pickTotalInfo(payload, items, skipCount) {
        const candidates = [
            payload?.totalItems,
            payload?.total,
            payload?.totalCount,
            payload?.totalRecords,
            payload?.totalElements,
            payload?.pagination?.totalItems,
            payload?.pagination?.total,
            payload?.pagination?.totalCount,
            payload?.pagination?.totalRecords,
            payload?.data?.totalItems,
            payload?.data?.total,
            payload?.data?.totalCount,
            payload?.data?.totalRecords,
            payload?.data?.totalElements,
            payload?.list?.pagination?.totalItems,
            payload?.list?.pagination?.total,
            payload?.list?.pagination?.totalCount,
        ];
        const total = candidates.map(Number).find((value) => Number.isFinite(value) && value >= 0);

        if (total !== undefined) {
            return {
                totalItems: total,
                hasKnownTotal: true,
            };
        }

        return {
            totalItems: skipCount + items.length + (payload?.hasMoreItems ? 1 : 0),
            hasKnownTotal: false,
        };
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
        setMessage('เลือก folder เพื่อโหลดเอกสาร');
    }

    function showLoadingSpinner() {
        rows.innerHTML = `
            <tr>
                <td colspan="5" class="loading-spinner-row">
                    <div id="loading-spinner" class="loading-spinner text-center my-4">
                        <i class="fa-solid fa-spinner fa-spin loading-spinner-icon"></i>
                        <p class="loading-spinner-text">กำลังโหลดข้อมูล...</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function createFolderButton(item) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'folder-item';
        button.dataset.path = item.path;
        button.innerHTML = `
            <span class="folder-name">
                <i class="fa-solid fa-folder" aria-hidden="true"></i>
                <span>${escapeHtml(item.name || item.path)}</span>
            </span>
            <span class="folder-path">${escapeHtml(item.path || '')}</span>
        `;
        button.addEventListener('click', async () => {
            state.page = 1;
            setSelectedFolder(item.path);
            keywordInput.value = '';
            setResultCount(0);
            updatePager(true);
            showLoadingSpinner();

            try {
                await loadDocuments();
            } catch (error) {
                setMessage(error.message, true);
                rows.innerHTML = '<tr><td colspan="5" class="muted">โหลดข้อมูลไม่สำเร็จ</td></tr>';
                updatePager(false);
            }
        });

        return button;
    }

    async function loadDocuments() {
        const maxItems = Number(pageSizeInput.value || 100);
        const skipCount = (state.page - 1) * maxItems;
        const keyword = keywordInput.value.trim();

        state.pageSize = maxItems;
        setMessage('กำลังดึงเอกสาร...');
        showLoadingSpinner();
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
        state.currentItemCount = items.length;
        const totalInfo = pickTotalInfo(payload, items, skipCount);
        state.totalItems = totalInfo.totalItems;
        state.hasKnownTotal = totalInfo.hasKnownTotal;

        renderRows(sortItemsByName(items));
        setResultCount(items.length);
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
            rows.innerHTML = '<tr><td colspan="5" class="muted">ไม่มีข้อมูล</td></tr>';
            return;
        }

        rows.innerHTML = items.map((item) => {
            const id = escapeHtml(item.id || '');
            const name = escapeHtml(item.name || '-');
            const openName = escapeHtml(item.name || 'file.pdf');

            return `
                <tr>
                    <td>
                        <div class="file-name">
                            <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
                            <span>${name}</span>
                        </div>
                    </td>
                    <td>
                        <span class="file-badge">
                            <i class="fa-solid fa-tag" aria-hidden="true"></i>
                            <span>${escapeHtml(item.mimeType || '-')}</span>
                        </span>
                    </td>
                    <td>${formatSize(item.size)}</td>
                    <td>
                        <div class="file-meta">
                            <span>
                                <i class="fa-regular fa-user" aria-hidden="true"></i>
                                ผู้สร้าง: ${escapeHtml(item.createdBy || '-')}
                            </span>
                            <span>
                                <i class="fa-regular fa-calendar" aria-hidden="true"></i>
                                วันที่สร้าง: ${escapeHtml(formatDate(item.creationDate))}
                            </span>
                        </div>
                    </td>
                    <td>
                        <button type="button" class="open-link open-file-btn" data-id="${id}" data-name="${openName}">
                            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                            <span>เปิดไฟล์</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function sortItemsByName(items) {
        return [...items].sort((left, right) => {
            const leftName = String(left.name || '');
            const rightName = String(right.name || '');
            const result = leftName.localeCompare(rightName, 'th', {
                numeric: true,
                sensitivity: 'base',
            });

            return state.nameSortDirection === 'asc' ? result : -result;
        });
    }

    function updateNameSortButton() {
        if (!sortNameBtn) {
            return;
        }

        const icon = sortNameBtn.querySelector('i');
        const isAscending = state.nameSortDirection === 'asc';

        sortNameBtn.setAttribute('aria-sort', isAscending ? 'ascending' : 'descending');
        sortNameBtn.setAttribute('title', isAscending ? 'เรียงชื่อไฟล์ A-Z' : 'เรียงชื่อไฟล์ Z-A');

        if (icon) {
            icon.className = isAscending ? 'fa-solid fa-arrow-down-a-z' : 'fa-solid fa-arrow-down-z-a';
        }
    }

    async function openFile(id, name) {
        if (hasIdleExpired()) {
            expireSession();
            throw new Error('Session หมดอายุ กรุณา login ใหม่');
        }

        const viewerWindow = window.open('', '_blank');
        if (!viewerWindow) {
            throw new Error('Browser บล็อก popup กรุณาอนุญาต popup สำหรับเว็บไซต์นี้');
        }

        viewerWindow.opener = null;
        viewerWindow.document.title = name || 'file.pdf';
        viewerWindow.document.body.textContent = 'กำลังโหลดไฟล์...';

        const url = apiUrl(`/user-api/alfresco/documents/${encodeURIComponent(id)}/content?name=${encodeURIComponent(name || 'file.pdf')}`);
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            viewerWindow.close();
            throw new Error(`เปิดไฟล์ไม่สำเร็จ: HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        viewerWindow.location.href = objectUrl;
    }

    function updatePager(isLoading) {
        const totalPages = Math.max(1, Math.ceil(state.totalItems / state.pageSize));
        const isFirstPage = state.page <= 1;
        const isLastPage = state.hasKnownTotal ? state.page >= totalPages : !state.hasMoreItems;
        const startItem = state.currentItemCount ? ((state.page - 1) * state.pageSize) + 1 : 0;
        const endItem = state.currentItemCount ? startItem + state.currentItemCount - 1 : 0;

        pageRangeInfo.textContent = `แสดง ${startItem} ถึง ${endItem} จากทั้งหมด ${state.totalItems} รายการ`;
        pageInfo.textContent = `หน้า ${state.page} / ${totalPages}`;
        firstBtn.disabled = isLoading || isFirstPage;
        prevBtn.disabled = isLoading || isFirstPage;
        nextBtn.disabled = isLoading || isLastPage;
        lastBtn.disabled = isLoading || !state.hasKnownTotal || isLastPage;
    }

    function logout(sessionMessage, showPopup = false) {
        if (showPopup && sessionMessage) {
            showSessionExpiredPopup(sessionMessage);
            return;
        }

        if (sessionMessage) {
            sessionStorage.setItem(storage.sessionMessage, sessionMessage);
        }

        clearStoredSession();
        window.location.href = config.loginUrl;
    }

    function showSessionExpiredPopup(sessionMessage) {
        if (sessionExpired) {
            return;
        }

        sessionExpired = true;

        if (!sessionTimeoutModal || !sessionTimeoutOkBtn) {
            sessionStorage.setItem(storage.sessionMessage, sessionMessage);
            clearStoredSession();
            window.location.href = config.loginUrl;
            return;
        }

        if (sessionTimeoutMessage) {
            sessionTimeoutMessage.textContent = sessionMessage;
        }

        sessionTimeoutModal.hidden = false;
        sessionTimeoutOkBtn.focus();
    }

    function showLogoutConfirm() {
        if (sessionExpired) {
            return;
        }

        if (!logoutConfirmModal || !logoutConfirmBtn) {
            logout();
            return;
        }

        logoutConfirmModal.hidden = false;
        logoutConfirmBtn.focus();
    }

    function hideLogoutConfirm() {
        if (logoutConfirmModal) {
            logoutConfirmModal.hidden = true;
        }
    }

    function clearStoredSession() {
        localStorage.removeItem(storage.accessToken);
        localStorage.removeItem(storage.username);
        localStorage.removeItem(storage.lastActivity);
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
        state.currentItemCount = 0;
        state.totalItems = 0;
        state.hasKnownTotal = false;
        rows.innerHTML = '';
        setResultCount(0);
        setMessage('ล้างคำค้นแล้ว เลือก folder เพื่อโหลดเอกสาร หรือกดค้นหาใน folder ปัจจุบัน');
        updatePager(false);
    });

    reloadFoldersBtn.addEventListener('click', () => loadFolders().catch((error) => setMessage(error.message, true)));
    logoutBtn.addEventListener('click', (event) => {
        event.preventDefault();
        showLogoutConfirm();
    });

    if (sessionTimeoutOkBtn) {
        sessionTimeoutOkBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            clearStoredSession();
            window.location.href = config.loginUrl;
        });
    }

    if (logoutConfirmBtn) {
        logoutConfirmBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            logout();
        });
    }

    if (logoutCancelBtn) {
        logoutCancelBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            hideLogoutConfirm();
        });
    }

    rows.addEventListener('click', (event) => {
        const button = event.target.closest('.open-file-btn');
        if (!button) return;
        openFile(button.dataset.id, button.dataset.name).catch((error) => setMessage(error.message, true));
    });

    if (sortNameBtn) {
        sortNameBtn.addEventListener('click', () => {
            state.nameSortDirection = state.nameSortDirection === 'asc' ? 'desc' : 'asc';
            updateNameSortButton();
            loadDocuments().catch((error) => setMessage(error.message, true));
        });
    }

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

    lastBtn.addEventListener('click', () => {
        if (!state.hasKnownTotal) {
            return;
        }

        state.page = Math.max(1, Math.ceil(state.totalItems / state.pageSize));
        loadDocuments().catch((error) => setMessage(error.message, true));
    });

    setSelectedFolder(config.rootPath);
    updateNameSortButton();
    updatePager(false);
    loadFolders().catch((error) => setMessage(error.message, true));
})();
