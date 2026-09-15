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
        folderPath: '',
        folderLabel: 'หน้าหลัก',
        isHomeSelected: true,
        page: 1,
        hasMoreItems: false,
        pageSize: 25,
        totalItems: 0,
        currentItemCount: 0,
        hasKnownTotal: false,
        nameSortDirection: 'asc',
    };

    const folderList = document.getElementById('folderList');
    const selectedFolder = document.getElementById('selectedFolder');
    const folderCrumb = document.getElementById('folderCrumb');
    const folderCrumbSeparator = document.getElementById('folderCrumbSeparator');
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
    const renameFileModal = document.getElementById('renameFileModal');
    const renameFileForm = document.getElementById('renameFileForm');
    const renameFileCurrentName = document.getElementById('renameFileCurrentName');
    const renameFileInput = document.getElementById('renameFileInput');
    const renameFileExtension = document.getElementById('renameFileExtension');
    const renameFileSaveBtn = document.getElementById('renameFileSaveBtn');
    const renameFileCancelBtn = document.getElementById('renameFileCancelBtn');
    const fileInfoModal = document.getElementById('fileInfoModal');
    const fileInfoList = document.getElementById('fileInfoList');
    const fileInfoCloseBtn = document.getElementById('fileInfoCloseBtn');
    let activeRename = null;

    const savedUsername = localStorage.getItem(storage.username) || '-';
    if (userName) {
        userName.textContent = savedUsername;
    }

    if (userAvatar) {
        userAvatar.textContent = savedUsername.charAt(0).toUpperCase() || 'A';
    }

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

    function setSelectedFolder(path, label, isHome = false) {
        state.folderPath = path;
        state.folderLabel = label || path;
        state.isHomeSelected = isHome;
        folderPathInput.value = path;
        selectedFolder.textContent = isHome ? 'เลือกโฟลเดอร์เอกสาร' : state.folderLabel;

        if (folderCrumb) {
            folderCrumb.textContent = state.folderLabel;
            folderCrumb.hidden = isHome;
        }

        if (folderCrumbSeparator) {
            folderCrumbSeparator.hidden = isHome;
        }

        document.querySelectorAll('.folder-item').forEach((button) => {
            button.classList.toggle('active', button.dataset.key === (isHome ? 'home' : path));
        });
    }

    async function requestJson(path, options = {}) {
        if (hasIdleExpired()) {
            expireSession();
            throw new Error('Session หมดอายุ กรุณา login ใหม่');
        }

        const response = await fetch(apiUrl(path), {
            ...options,
            headers: authHeaders(options.headers || {}),
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            forceLogoutByApi();
            throw new Error('Session หมดอายุ กรุณา login ใหม่');
        }

        if (!response.ok) {
            const error = new Error(data.message || 'เรียก API ไม่สำเร็จ');
            error.status = response.status;
            error.payload = data;
            throw error;
        }

        return data;
    }

    async function patchJson(path, body) {
        return requestJson(path, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    }

    async function requestFileLocation(id) {
        const url = new URL('/user-api/alfresco/documents/location', config.apiBaseUrl);
        url.searchParams.set('id', id);

        try {
            return await requestJson(`${url.pathname}${url.search}`);
        } catch (error) {
            if (error.status === 404) {
                return requestJson(`/user-api/alfresco/documents/${encodeURIComponent(id)}/location`);
            }

            throw error;
        }
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
            name: 'หน้าหลัก',
            path: '',
            icon: 'fa-house',
            isHome: true,
        }));
        folderList.appendChild(createFolderButton({
            name: 'คลังเอกสาร',
            path: config.rootPath,
            icon: 'fa-folder-tree',
        }));
        items.forEach((item) => folderList.appendChild(createFolderButton(item)));
        setSelectedFolder(state.folderPath, state.folderLabel, state.isHomeSelected);
        setMessage('เลือก folder เพื่อโหลดเอกสาร');
    }

    function showLoadingSpinner() {
        rows.innerHTML = `
            <tr>
                <td colspan="4" class="loading-spinner-row">
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
        const folderName = item.name || item.path;
        const iconClass = item.icon || getFolderIcon(folderName);

        button.type = 'button';
        button.className = 'folder-item';
        button.dataset.path = item.path;
        button.dataset.key = item.isHome ? 'home' : item.path;
        button.innerHTML = `
            <span class="folder-name">
                <i class="fa-solid ${escapeHtml(iconClass)}" aria-hidden="true"></i>
                <span>${escapeHtml(folderName)}</span>
            </span>
            <span class="folder-path">${escapeHtml(item.path || '')}</span>
        `;
        button.addEventListener('click', async () => {
            state.page = 1;
            setSelectedFolder(item.path, folderName, Boolean(item.isHome));
            keywordInput.value = '';
            state.currentItemCount = 0;
            state.totalItems = 0;
            state.hasKnownTotal = false;
            setResultCount(0);

            if (item.isHome) {
                showSelectFolderPrompt();
                setMessage('เลือก folder เพื่อโหลดเอกสาร');
                updatePager(false);
                return;
            }

            updatePager(true);
            showLoadingSpinner();

            try {
                await loadDocuments({ allowList: true });
            } catch (error) {
                setMessage(error.message, true);
                rows.innerHTML = '<tr><td colspan="4" class="muted">โหลดข้อมูลไม่สำเร็จ</td></tr>';
                updatePager(false);
            }
        });

        return button;
    }

    function getFolderIcon(folderName) {
        const name = String(folderName || '');
        const iconMap = [
            { pattern: /คลังเอกสาร/, icon: 'fa-folder-tree' },
            { pattern: /บัญชี/, icon: 'fa-briefcase' },
            { pattern: /การเงิน|เงิน/, icon: 'fa-coins' },
            { pattern: /สินเชื่อ|เงินกู้|กู้/, icon: 'fa-hand-holding-dollar' },
            { pattern: /ทะเบียนหุ้น|หุ้น/, icon: 'fa-chart-pie' },
            { pattern: /นิติกร|กฎหมาย|คดี/, icon: 'fa-scale-balanced' },
            { pattern: /บริหาร/, icon: 'fa-gears' },
            { pattern: /ตะกร้า/, icon: 'fa-box-archive' },
            { pattern: /สหกรณ์|สำนักงาน/, icon: 'fa-building-columns' },
        ];
        const matched = iconMap.find((item) => item.pattern.test(name));

        return matched ? matched.icon : 'fa-folder';
    }

    async function loadDocuments(options = {}) {
        const maxItems = Number(pageSizeInput.value || 25);
        const skipCount = (state.page - 1) * maxItems;
        const keyword = keywordInput.value.trim();
        const allowList = Boolean(options.allowList);
        const refreshKey = options.refresh ? String(Date.now()) : '';

        if (state.isHomeSelected) {
            state.currentItemCount = 0;
            state.totalItems = 0;
            state.hasKnownTotal = false;
            showSelectFolderPrompt();
            updatePager(false);
            return;
        }

        if (!keyword && !allowList) {
            setMessage('กรุณากรอกชื่อไฟล์หรือเลขที่เอกสารก่อนค้นหา', true);
            keywordInput.focus();
            return;
        }

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
            if (refreshKey) {
                url.searchParams.set('_', refreshKey);
            }
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
        const exactUrl = new URL('/user-api/alfresco/documents/search', config.apiBaseUrl);
        exactUrl.searchParams.set('folderPath', state.folderPath);
        exactUrl.searchParams.set('exactName', keyword);
        exactUrl.searchParams.set('maxItems', String(maxItems));
        exactUrl.searchParams.set('skipCount', String(skipCount));
        const exactPayload = await requestJson(`${exactUrl.pathname}${exactUrl.search}`);

        if (pickItems(exactPayload).length) {
            exactPayload.message = 'พบจากการค้นชื่อไฟล์เต็ม';
            return exactPayload;
        }

        const partialUrl = new URL('/user-api/alfresco/documents/search', config.apiBaseUrl);
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
            const sizeText = escapeHtml(formatSize(item.size));
            const createdBy = escapeHtml(item.createdBy || '-');
            const creationDate = escapeHtml(formatDate(item.creationDate));
            const lastModifiedBy = escapeHtml(item.lastModifiedBy || '-');
            const lastModificationDate = escapeHtml(formatDate(item.lastModificationDate));
            const mimeType = escapeHtml(item.mimeType || '-');
            const allowRename = item.allowRename === true;
            const renameAction = allowRename
                ? `
                            <button type="button" class="rename-file-btn icon-action-btn rename-action-btn" data-id="${id}" data-name="${openName}" data-allow-rename="true" aria-label="แก้ไขชื่อไฟล์" title="แก้ไขชื่อไฟล์">
                                <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                            </button>
                `
                : '';

            return `
                <tr>
                    <td>
                        <div class="file-name">
                            <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
                            <span>${name}</span>
                        </div>
                    </td>
                    <td>${sizeText}</td>
                    <td>
                        <button
                            type="button"
                            class="file-info-btn"
                            data-id="${id}"
                            data-name="${openName}"
                            data-size="${sizeText}"
                            data-mime-type="${mimeType}"
                            data-created-by="${createdBy}"
                            data-creation-date="${creationDate}"
                            data-last-modified-by="${lastModifiedBy}"
                            data-last-modification-date="${lastModificationDate}"
                            aria-label="ดูรายละเอียดไฟล์ ${name}"
                            title="ดูรายละเอียดไฟล์"
                        >
                            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                            <span>รายละเอียด</span>
                        </button>
                    </td>
                    <td>
                        <div class="row-actions">
                            <button type="button" class="open-file-btn icon-action-btn" data-id="${id}" data-name="${openName}" aria-label="เปิดไฟล์" title="เปิดไฟล์">
                                <i class="fa-solid fa-eye" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="download-file-btn icon-action-btn download-action-btn" data-id="${id}" data-name="${openName}" aria-label="ดาวน์โหลดไฟล์" title="ดาวน์โหลดไฟล์">
                                <i class="fa-solid fa-download" aria-hidden="true"></i>
                            </button>
${renameAction}
                        </div>
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

    async function fetchFileBlob(id, name, errorPrefix = 'เปิดไฟล์ไม่สำเร็จ') {
        if (hasIdleExpired()) {
            expireSession();
            throw new Error('Session หมดอายุ กรุณา login ใหม่');
        }

        const url = apiUrl(`/user-api/alfresco/documents/${encodeURIComponent(id)}/content?name=${encodeURIComponent(name || 'file.pdf')}`);
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`${errorPrefix}: HTTP ${response.status}`);
        }

        return response.blob();
    }

    async function openFile(id, name) {
        const viewerWindow = window.open('', '_blank');
        if (!viewerWindow) {
            throw new Error('Browser บล็อก popup กรุณาอนุญาต popup สำหรับเว็บไซต์นี้');
        }

        viewerWindow.opener = null;
        viewerWindow.document.title = name || 'file.pdf';
        viewerWindow.document.body.textContent = 'กำลังโหลดไฟล์...';

        try {
            const blob = await fetchFileBlob(id, name, 'เปิดไฟล์ไม่สำเร็จ');
            const objectUrl = URL.createObjectURL(blob);
            viewerWindow.location.href = objectUrl;
        } catch (error) {
            viewerWindow.close();
            throw error;
        }
    }

    async function downloadFile(id, name) {
        const blob = await fetchFileBlob(id, name, 'ดาวน์โหลดไฟล์ไม่สำเร็จ');
        const objectUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');

        downloadLink.href = objectUrl;
        downloadLink.download = name || 'file.pdf';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(objectUrl);
    }

    async function showFileInfoModal(button) {
        if (!fileInfoModal || !fileInfoList) {
            setMessage('ไม่พบ modal รายละเอียดไฟล์', true);
            return;
        }

        const details = [
            ['ชื่อไฟล์', button.dataset.name || '-'],
            ['ขนาดไฟล์', button.dataset.size || '-'],
            ['ชนิดไฟล์', button.dataset.mimeType || '-'],
            ['ผู้สร้าง', button.dataset.createdBy || '-'],
            ['วันที่สร้าง', button.dataset.creationDate || '-'],
            ['ผู้แก้ไขล่าสุด', button.dataset.lastModifiedBy || '-'],
            ['วันที่แก้ไขล่าสุด', button.dataset.lastModificationDate || '-'],
            ['ตำแหน่งไฟล์', 'กำลังโหลด...'],
        ];

        fileInfoList.innerHTML = details.map(([label, value]) => `
            <div data-detail-key="${escapeHtml(label)}">
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(value)}</dd>
            </div>
        `).join('');

        fileInfoModal.hidden = false;
        fileInfoCloseBtn?.focus();

        const locationValue = fileInfoList.querySelector('[data-detail-key="ตำแหน่งไฟล์"] dd');

        if (!locationValue) {
            return;
        }

        try {
            const payload = await requestFileLocation(button.dataset.id);
            locationValue.textContent = payload.parentPath || 'ไม่พบข้อมูลตำแหน่งไฟล์';
        } catch (error) {
            locationValue.textContent = error.message || 'โหลดตำแหน่งไฟล์ไม่สำเร็จ';
        }
    }

    function hideFileInfoModal() {
        if (fileInfoModal) {
            fileInfoModal.hidden = true;
        }
    }

    function showRenameModal(id, currentName) {
        if (!id) {
            throw new Error('ไม่พบ id ของไฟล์');
        }

        if (!renameFileModal || !renameFileInput || !renameFileCurrentName) {
            setMessage('ไม่พบ modal แก้ไขชื่อไฟล์', true);
            return;
        }

        const nameParts = splitFileName(currentName || '');
        activeRename = { id, currentName: currentName || '', extension: nameParts.extension };
        renameFileCurrentName.textContent = currentName || '-';
        renameFileInput.value = nameParts.baseName;
        if (renameFileExtension) {
            renameFileExtension.textContent = nameParts.extension;
            renameFileExtension.hidden = !nameParts.extension;
        }
        renameFileModal.hidden = false;

        window.setTimeout(() => {
            renameFileInput.focus();
            renameFileInput.select();
        }, 0);
    }

    function hideRenameModal() {
        if (renameFileModal) {
            renameFileModal.hidden = true;
        }

        activeRename = null;
    }

    function setRenameModalBusy(isBusy) {
        if (renameFileInput) {
            renameFileInput.disabled = isBusy;
        }

        if (renameFileSaveBtn) {
            renameFileSaveBtn.disabled = isBusy;
            renameFileSaveBtn.innerHTML = isBusy
                ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>กำลังบันทึก</span>'
                : '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i><span>บันทึก</span>';
        }

        if (renameFileCancelBtn) {
            renameFileCancelBtn.disabled = isBusy;
        }
    }

    function splitFileName(fileName) {
        const value = String(fileName || '');
        const dotIndex = value.lastIndexOf('.');

        if (dotIndex <= 0 || dotIndex === value.length - 1) {
            return { baseName: value, extension: '' };
        }

        return {
            baseName: value.slice(0, dotIndex),
            extension: value.slice(dotIndex),
        };
    }

    function buildRenameFileName(baseName, extension) {
        const trimmedBaseName = baseName.trim();

        if (!extension) {
            return trimmedBaseName;
        }

        if (!trimmedBaseName) {
            return '';
        }

        return trimmedBaseName.toLowerCase().endsWith(extension.toLowerCase())
            ? trimmedBaseName
            : `${trimmedBaseName}${extension}`;
    }

    async function renameFile(id, currentName, nextName) {
        if (!id) {
            throw new Error('ไม่พบ id ของไฟล์');
        }

        const trimmedName = nextName.trim();

        if (!trimmedName) {
            setMessage('กรุณากรอกชื่อไฟล์', true);
            renameFileInput?.focus();
            return false;
        }

        if (trimmedName === currentName) {
            setMessage('ชื่อไฟล์ไม่มีการเปลี่ยนแปลง');
            return false;
        }

        if (/[\\/]/.test(trimmedName)) {
            setMessage('ชื่อไฟล์ต้องไม่มีเครื่องหมาย / หรือ \\', true);
            renameFileInput?.focus();
            return false;
        }

        setMessage(`กำลังแก้ไขชื่อไฟล์ ${currentName || '-'}...`);

        const url = new URL('/user-api/alfresco/documents', config.apiBaseUrl);
        url.searchParams.set('id', id);
        const payload = await patchJson(`${url.pathname}${url.search}`, { name: trimmedName });
        keywordInput.value = '';
        state.page = 1;
        await loadDocuments({ allowList: true, refresh: true });
        setMessage(payload.message || `แก้ไขชื่อไฟล์เป็น ${trimmedName} แล้ว`);
        return true;
    }

    function showSelectFolderPrompt() {
        rows.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state-cell">
                    <div class="empty-state">
                        <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
                        <p>กรุณาเลือก folder เพื่อแสดงข้อมูลเอกสาร</p>
                    </div>
                </td>
            </tr>
        `;
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

        if (!keywordInput.value.trim()) {
            setMessage('กรุณากรอกชื่อไฟล์หรือเลขที่เอกสารก่อนค้นหา', true);
            keywordInput.focus();
            return;
        }

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
        setResultCount(0);

        if (state.isHomeSelected || !state.folderPath) {
            setSelectedFolder('', 'หน้าหลัก', true);
            showSelectFolderPrompt();
            setMessage('ล้างคำค้นแล้ว เลือก folder เพื่อโหลดเอกสาร');
            updatePager(false);
            return;
        }

        setMessage('ล้างคำค้นแล้ว กำลังโหลดรายการเอกสารใน folder เดิม...');
        showLoadingSpinner();
        updatePager(true);

        loadDocuments({ allowList: true }).catch((error) => {
            setMessage(error.message, true);
            rows.innerHTML = '<tr><td colspan="4" class="muted">โหลดข้อมูลไม่สำเร็จ</td></tr>';
            updatePager(false);
        });
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

    if (fileInfoCloseBtn) {
        fileInfoCloseBtn.addEventListener('click', () => hideFileInfoModal());
    }

    if (fileInfoModal) {
        fileInfoModal.addEventListener('click', (event) => {
            if (event.target === fileInfoModal) {
                hideFileInfoModal();
            }
        });
    }

    if (renameFileForm) {
        renameFileForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!activeRename || !renameFileInput) {
                return;
            }

            setRenameModalBusy(true);

            try {
                const nextName = buildRenameFileName(renameFileInput.value, activeRename.extension || '');
                const didRename = await renameFile(activeRename.id, activeRename.currentName, nextName);

                if (didRename) {
                    hideRenameModal();
                }
            } catch (error) {
                setMessage(error.message, true);
            } finally {
                setRenameModalBusy(false);
            }
        });
    }

    if (renameFileCancelBtn) {
        renameFileCancelBtn.addEventListener('click', () => hideRenameModal());
    }

    if (renameFileModal) {
        renameFileModal.addEventListener('click', (event) => {
            if (event.target === renameFileModal) {
                hideRenameModal();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && renameFileModal && !renameFileModal.hidden) {
            hideRenameModal();
        }

        if (event.key === 'Escape' && fileInfoModal && !fileInfoModal.hidden) {
            hideFileInfoModal();
        }
    });

    rows.addEventListener('click', (event) => {
        const openButton = event.target.closest('.open-file-btn');
        const downloadButton = event.target.closest('.download-file-btn');
        const infoButton = event.target.closest('.file-info-btn');
        const renameButton = event.target.closest('.rename-file-btn');

        if (renameButton) {
            try {
                if (renameButton.dataset.allowRename !== 'true') {
                    setMessage('คุณไม่มีสิทธิ์แก้ไขชื่อไฟล์นี้', true);
                    return;
                }

                showRenameModal(renameButton.dataset.id, renameButton.dataset.name);
            } catch (error) {
                setMessage(error.message, true);
            }
            return;
        }

        if (infoButton) {
            showFileInfoModal(infoButton).catch((error) => setMessage(error.message, true));
            return;
        }

        if (openButton) {
            openFile(openButton.dataset.id, openButton.dataset.name).catch((error) => setMessage(error.message, true));
            return;
        }

        if (downloadButton) {
            downloadFile(downloadButton.dataset.id, downloadButton.dataset.name).catch((error) => setMessage(error.message, true));
            return;
        }

    });

    if (sortNameBtn) {
        sortNameBtn.addEventListener('click', () => {
            state.nameSortDirection = state.nameSortDirection === 'asc' ? 'desc' : 'asc';
            updateNameSortButton();
            loadDocuments({ allowList: true }).catch((error) => setMessage(error.message, true));
        });
    }

    firstBtn.addEventListener('click', () => {
        state.page = 1;
        loadDocuments({ allowList: true }).catch((error) => setMessage(error.message, true));
    });

    prevBtn.addEventListener('click', () => {
        state.page = Math.max(1, state.page - 1);
        loadDocuments({ allowList: true }).catch((error) => setMessage(error.message, true));
    });

    nextBtn.addEventListener('click', () => {
        state.page += 1;
        loadDocuments({ allowList: true }).catch((error) => setMessage(error.message, true));
    });

    lastBtn.addEventListener('click', () => {
        if (!state.hasKnownTotal) {
            return;
        }

        state.page = Math.max(1, Math.ceil(state.totalItems / state.pageSize));
        loadDocuments({ allowList: true }).catch((error) => setMessage(error.message, true));
    });

    setSelectedFolder('', 'หน้าหลัก', true);
    updateNameSortButton();
    updatePager(false);
    loadFolders().catch((error) => setMessage(error.message, true));
})();
