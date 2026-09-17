(function () {
    const config = window.AlfrescoDirect;
    const storage = {
        accessToken: 'alfresco_direct_access_token',
        username: 'alfresco_direct_username',
        lastActivity: 'alfresco_direct_last_activity',
        sessionMessage: 'alfresco_direct_session_message',
        lastFolderPath: 'alfresco_direct_last_folder_path',
        lastFolderLabel: 'alfresco_direct_last_folder_label',
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
    const folderResultBadge = document.getElementById('folderResultBadge');
    const folderCrumb = document.getElementById('folderCrumb');
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
    const collapseFoldersBtn = document.getElementById('collapseFoldersBtn');
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
    let folderLoadRunId = 0;
    let folderTreeButtons = new Map();
    let folderTreeChildren = new Map();

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

    function saveLastFolder(path, label, isHome = false) {
        if (isHome || !path) {
            sessionStorage.removeItem(storage.lastFolderPath);
            sessionStorage.removeItem(storage.lastFolderLabel);
            return;
        }

        sessionStorage.setItem(storage.lastFolderPath, path);
        sessionStorage.setItem(storage.lastFolderLabel, label || path);
    }

    function getSavedFolder() {
        const path = sessionStorage.getItem(storage.lastFolderPath) || '';
        const label = sessionStorage.getItem(storage.lastFolderLabel) || '';

        return { path, label };
    }

    function resetFolderResultBadge() {
        if (!folderResultBadge) {
            return;
        }

        folderResultBadge.hidden = true;
        folderResultBadge.textContent = '';
    }

    function setFolderResultBadge(text, isLoading = false) {
        if (!folderResultBadge) {
            return;
        }

        folderResultBadge.hidden = true;
        folderResultBadge.classList.toggle('loading', Boolean(isLoading));
        folderResultBadge.innerHTML = isLoading
            ? `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>${escapeHtml(text)}</span>`
            : `<i class="fa-solid fa-file-lines" aria-hidden="true"></i><span>${escapeHtml(text)}</span>`;
    }

    function setSelectedFolder(path, label, isHome = false, persist = true) {
        state.folderPath = path;
        state.folderLabel = label || path;
        state.isHomeSelected = isHome;
        folderPathInput.value = path;
        selectedFolder.textContent = isHome ? 'เลือกโฟลเดอร์เอกสาร' : state.folderLabel;
        if (persist) {
            saveLastFolder(path, state.folderLabel, isHome);
        }

        renderBreadcrumb(path, isHome);

        document.querySelectorAll('.folder-item').forEach((button) => {
            button.classList.toggle('active', button.dataset.key === (isHome ? 'home' : path));
        });
    }

    function renderBreadcrumb(path, isHome = false) {
        if (!folderCrumb) {
            return;
        }

        const parts = getBreadcrumbItems(path, isHome);
        folderCrumb.innerHTML = parts.map((part, index) => {
            const tag = index === parts.length - 1 ? 'strong' : 'button';
            const separator = index ? '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>' : '';
            const attrs = tag === 'button'
                ? ` type="button" class="breadcrumb-action" data-path="${escapeHtml(part.path)}" data-label="${escapeHtml(part.label)}" data-home="${part.isHome ? 'true' : 'false'}"`
                : '';

            return `${separator}<${tag}${attrs}>${escapeHtml(part.label)}</${tag}>`;
        }).join('');
    }

    function getBreadcrumbItems(path, isHome = false) {
        if (isHome || !path) {
            return [{ label: 'หน้าหลัก', path: '', isHome: true }];
        }

        const root = normalizePathForCompare(config.rootPath);
        const currentPath = normalizePathForCompare(path);
        const parts = [
            { label: 'หน้าหลัก', path: '', isHome: true },
            { label: 'คลังเอกสาร', path: root, isHome: false },
        ];

        if (currentPath === root) {
            return parts;
        }

        if (currentPath.startsWith(`${root}/`)) {
            let accumulatedPath = root;
            const childParts = currentPath
                    .slice(root.length + 1)
                    .split('/')
                    .filter(Boolean)
                    .map((segment) => {
                        accumulatedPath = `${accumulatedPath}/${segment}`;

                        return {
                            label: segment,
                            path: accumulatedPath,
                            isHome: false,
                        };
                    });

            return [...parts, ...childParts];
        }

        return [...parts, { label: getPathName(currentPath), path: currentPath, isHome: false }];
    }

    function selectHomeFolder() {
        collapseAllFolderChildren();
        setSelectedFolder('', 'หน้าหลัก', true);
        keywordInput.value = '';
        state.page = 1;
        state.currentItemCount = 0;
        state.totalItems = 0;
        state.hasKnownTotal = false;
        setResultCount(0);
        resetFolderResultBadge();
        showSelectFolderPrompt();
        setMessage('เลือก folder เพื่อโหลดเอกสาร');
        updatePager(false);
    }

    function selectBreadcrumbFolder(path, label, isHome = false) {
        if (isHome) {
            selectHomeFolder();
            return;
        }

        const button = folderTreeButtons.get(path);
        const folderLabel = label || button?.querySelector('.folder-label')?.textContent || getPathName(path);

        setSelectedFolder(path, folderLabel, false);
        keywordInput.value = '';
        state.page = 1;
        state.currentItemCount = 0;
        state.totalItems = 0;
        state.hasKnownTotal = false;
        setResultCount(0);
        resetFolderResultBadge();
        showSelectFolderPrompt();
        updatePager(false);

        if (button?.dataset.hasChildren === 'true') {
            setMessage('folder นี้มี folder ย่อย กรุณาเลือก folder ย่อยเพื่อแสดงเอกสาร');
        } else {
            setMessage('เลือก folder เพื่อโหลดเอกสาร');
        }
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
        if (Array.isArray(payload.folders)) return payload.folders;
        if (Array.isArray(payload.files)) return payload.files;
        if (Array.isArray(payload.data)) return payload.data;
        if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;
        if (payload.data && Array.isArray(payload.data.folders)) return payload.data.folders;
        if (payload.data && Array.isArray(payload.data.files)) return payload.data.files;
        if (payload.list && Array.isArray(payload.list.entries)) return payload.list.entries;
        if (payload.data?.list && Array.isArray(payload.data.list.entries)) return payload.data.list.entries;
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
        const runId = ++folderLoadRunId;
        setMessage('กำลังโหลด folder ตามสิทธิ์...');
        folderList.innerHTML = '';
        folderTreeButtons = new Map();
        folderTreeChildren = new Map();

        folderList.appendChild(createFolderButton({
            name: 'หน้าหลัก',
            path: '',
            icon: 'fa-house',
            isHome: true,
        }));
        const rootFolderButton = createFolderButton({
            name: 'คลังเอกสาร',
            path: config.rootPath,
            icon: 'fa-folder-tree',
            level: 0,
            isTreeRoot: true,
        });
        folderList.appendChild(rootFolderButton);
        folderTreeButtons.set(config.rootPath, rootFolderButton);

        setSelectedFolder(state.folderPath, state.folderLabel, state.isHomeSelected, false);
        const loaded = await loadFullFolderTree(rootFolderButton);

        if (runId !== folderLoadRunId) {
            return;
        }

        if (loaded && restoreLastFolder()) {
            return;
        }

        setSelectedFolder(state.folderPath, state.folderLabel, state.isHomeSelected, false);
        setMessage(loaded ? 'เลือก folder หลักเพื่อดู folder ย่อย หรือเลือก folder ปลายทางเพื่อแสดงเอกสาร' : 'เลือก folder เพื่อโหลดเอกสาร');
    }

    function markFolderChildrenState(path, children) {
        const button = folderTreeButtons.get(path);

        if (!button) {
            return;
        }

        button.dataset.childrenLoaded = 'true';
        if (children.length) {
            button.dataset.hasChildren = 'true';
        } else if (button.dataset.hasChildren !== 'true') {
            button.dataset.hasChildren = 'false';
        }

        updateFolderToggle(button);
    }

    function addFolderButtonToTree(item, folderButtons) {
        const button = createFolderButton(item);
        const parentButton = folderButtons.get(item.parentPath);
        const children = folderTreeChildren.get(item.path) || [];

        if (!parentButton) {
            folderList.appendChild(button);
        } else {
            parentButton.dataset.hasChildren = 'true';
            updateFolderToggle(parentButton);
            insertAfterParentTree(parentButton, button);
        }

        folderButtons.set(item.path, button);
        markFolderChildrenState(item.path, children);
    }

    function setFolderLoading(isLoading, text = 'กำลังโหลด folder...') {
        const existing = document.getElementById('folderLoadingState');

        if (!isLoading) {
            existing?.remove();
            return;
        }

        if (existing) {
            existing.querySelector('span').textContent = text;
            return;
        }

        const loadingState = document.createElement('div');
        loadingState.id = 'folderLoadingState';
        loadingState.className = 'folder-loading-state';
        loadingState.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            <span>${escapeHtml(text)}</span>
        `;
        folderList.appendChild(loadingState);
    }

    async function loadFullFolderTree(button) {
        if (button.dataset.treeLoaded === 'true') {
            return true;
        }

        if (button.dataset.treeLoading === 'true') {
            setMessage('กำลังโหลด folder หลักและ folder ย่อยทั้งหมดตามสิทธิ์...');
            setFolderLoading(true, 'กำลังโหลด folder ตามสิทธิ์...');
            return false;
        }

        const runId = folderLoadRunId;
        setMessage('กำลังโหลด folder หลักและ folder ย่อยทั้งหมดตามสิทธิ์...');
        setFolderLoading(true, 'กำลังโหลด folder ตามสิทธิ์...');
        button.dataset.treeLoading = 'true';
        button.classList.add('loading');

        try {
            const url = new URL('/user-api/alfresco/folders/tree', config.apiBaseUrl);
            url.searchParams.set('path', config.rootPath);
            const payload = await requestJson(`${url.pathname}${url.search}`);

            if (runId !== folderLoadRunId) {
                return false;
            }

            const treeItems = pickItems(payload).length ? pickItems(payload) : flattenTreeFolders(payload.tree || []);
            const folders = normalizeTreeFolders(treeItems, config.rootPath);
            folderTreeChildren = buildFolderChildrenMap(folders);
            revealFolderChildren(config.rootPath);
            button.dataset.treeLoaded = 'true';
            button.dataset.childrenLoaded = 'true';
            setSelectedFolder(state.folderPath, state.folderLabel, state.isHomeSelected);
            setMessage(folders.length ? `โหลด folder ตามสิทธิ์แล้ว ${folders.length} รายการ เลือก folder หลักเพื่อดู folder ย่อย` : 'ไม่พบ folder ย่อยตามสิทธิ์');
            return true;
        } finally {
            button.dataset.treeLoading = 'false';
            button.classList.remove('loading');
            setFolderLoading(false);
        }
    }

    function buildFolderChildrenMap(folders) {
        const childrenMap = new Map();

        folders.forEach((folder) => {
            const children = childrenMap.get(folder.parentPath) || [];
            children.push(folder);
            childrenMap.set(folder.parentPath, children);
        });

        return childrenMap;
    }

    function revealFolderChildren(parentPath) {
        const parentButton = folderTreeButtons.get(parentPath);

        if (!parentButton || parentButton.dataset.childrenRendered === 'true') {
            return folderTreeChildren.get(parentPath) || [];
        }

        const children = folderTreeChildren.get(parentPath) || [];
        children.forEach((folder) => addFolderButtonToTree(folder, folderTreeButtons));
        markFolderChildrenState(parentPath, children);
        parentButton.dataset.childrenRendered = 'true';
        updateFolderToggle(parentButton);

        return children;
    }

    function collapseFolderChildren(parentPath) {
        const parentButton = folderTreeButtons.get(parentPath);

        if (!parentButton || parentButton.dataset.childrenRendered !== 'true') {
            return;
        }

        const parentLevel = Number(parentButton.dataset.level || 0);
        let next = parentButton.nextElementSibling;

        while (next && next.classList.contains('folder-item') && Number(next.dataset.level || 0) > parentLevel) {
            const current = next;
            next = next.nextElementSibling;
            folderTreeButtons.delete(current.dataset.path);
            current.remove();
        }

        parentButton.dataset.childrenRendered = 'false';
        updateFolderToggle(parentButton);
    }

    function collapseAllFolderChildren() {
        const rootButton = folderTreeButtons.get(config.rootPath);

        if (!rootButton) {
            return;
        }

        const rootLevel = Number(rootButton.dataset.level || 0);
        let next = rootButton.nextElementSibling;

        while (next && next.classList.contains('folder-item')) {
            const current = next;
            next = next.nextElementSibling;

            if (Number(current.dataset.level || 0) > rootLevel + 1) {
                folderTreeButtons.delete(current.dataset.path);
                current.remove();
            } else {
                current.dataset.childrenRendered = 'false';
                updateFolderToggle(current);
            }
        }
    }

    function updateFolderToggle(button) {
        const toggle = button?.querySelector('.folder-toggle');

        if (!toggle) {
            return;
        }

        const hasChildren = button.dataset.hasChildren === 'true';
        const isOpen = button.dataset.childrenRendered === 'true';
        toggle.hidden = !hasChildren;
        toggle.className = `fa-solid ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'} folder-toggle`;
    }

    function toggleFolderChildren(path) {
        const button = folderTreeButtons.get(path);

        if (!button || button.dataset.hasChildren !== 'true') {
            return false;
        }

        if (button.dataset.childrenRendered === 'true') {
            collapseFolderChildren(path);
            return false;
        }

        revealFolderChildren(path);
        return true;
    }

    function revealFolderPath(path) {
        const root = normalizePathForCompare(config.rootPath);
        const currentPath = normalizePathForCompare(path);

        if (!currentPath.startsWith(`${root}/`)) {
            return;
        }

        let accumulatedPath = root;
        currentPath
            .slice(root.length + 1)
            .split('/')
            .filter(Boolean)
            .slice(0, -1)
            .forEach((segment) => {
                accumulatedPath = `${accumulatedPath}/${segment}`;
                revealFolderChildren(accumulatedPath);
            });
    }

    function restoreLastFolder() {
        const savedFolder = getSavedFolder();

        if (!savedFolder.path) {
            return false;
        }

        revealFolderPath(savedFolder.path);

        const folderButton = folderTreeButtons.get(savedFolder.path);
        const folderLabel = savedFolder.label || folderButton?.querySelector('.folder-label')?.textContent || getPathName(savedFolder.path);

        setSelectedFolder(savedFolder.path, folderLabel, false, false);
        state.page = 1;
        state.currentItemCount = 0;
        state.totalItems = 0;
        state.hasKnownTotal = false;
        setResultCount(0);
        setMessage(`กำลังเปิด folder ล่าสุด: ${folderLabel}...`);
        loadDocuments({ allowList: true }).catch((error) => {
            setMessage(error.message, true);
            setFolderResultBadge(`${folderLabel} · โหลดเอกสารไม่สำเร็จ`);
            rows.innerHTML = '<tr><td colspan="5" class="muted">โหลดข้อมูลไม่สำเร็จ</td></tr>';
            updatePager(false);
        });

        return true;
    }

    function flattenTreeFolders(items) {
        const folders = [];

        (Array.isArray(items) ? items : []).forEach((item) => {
            const { children, ...folder } = item;
            folders.push(folder);
            folders.push(...flattenTreeFolders(children || []));
        });

        return folders;
    }

    function normalizeTreeFolders(items, rootPath) {
        const root = normalizePathForCompare(rootPath);
        const folders = items
            .filter(isFolderItem)
            .map((item) => {
                const source = item.entry || item;
                const path = source.path || source.folderPath || source.fullPath || source.location;
                const normalizedPath = normalizePathForCompare(path);
                const parentPath = getParentFolderPath(normalizedPath);
                const level = getFolderLevel(normalizedPath, root);

                return {
                    ...source,
                    name: source.name || getPathName(normalizedPath),
                    path: normalizedPath,
                    parentPath,
                    level,
                };
            })
            .filter((folder) => folder.path && folder.path !== root && folder.path.startsWith(`${root}/`))
            .sort((left, right) => {
                const pathCompare = left.path.localeCompare(right.path, 'th');
                return pathCompare || left.name.localeCompare(right.name, 'th');
            });
        return folders;
    }

    function normalizePathForCompare(path) {
        const value = String(path || '').trim().replace(/\/+$/, '');
        return value || '/';
    }

    function getParentFolderPath(path) {
        const normalizedPath = normalizePathForCompare(path);
        const index = normalizedPath.lastIndexOf('/');

        return index > 0 ? normalizedPath.slice(0, index) : '/';
    }

    function getFolderLevel(path, rootPath) {
        const normalizedPath = normalizePathForCompare(path);
        const normalizedRoot = normalizePathForCompare(rootPath);

        if (!normalizedPath.startsWith(`${normalizedRoot}/`)) {
            return 1;
        }

        return normalizedPath
            .slice(normalizedRoot.length + 1)
            .split('/')
            .filter(Boolean)
            .length;
    }

    function insertAfterParentTree(parentButton, button) {
        const parentLevel = Number(parentButton.dataset.level || 0);
        let reference = parentButton;
        let next = reference.nextElementSibling;

        while (next && next.classList.contains('folder-item') && Number(next.dataset.level || 0) > parentLevel) {
            reference = next;
            next = next.nextElementSibling;
        }

        reference.after(button);
    }

    function isFolderItem(item) {
        const source = item.entry || item;
        const type = String(source.type || source.nodeType || source.objectTypeId || '').toLowerCase();

        return source.isFolder === true
            || source.isDocument === false
            || type.includes('folder')
            || type === 'cmis:folder'
            || type === 'cm:folder';
    }

    function getPathName(path) {
        return String(path || '').split('/').filter(Boolean).pop() || path || '';
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
        const folderName = item.name || item.path;
        const iconClass = item.icon || getFolderIcon(folderName);

        button.type = 'button';
        button.className = 'folder-item';
        button.title = item.isHome ? 'กลับหน้าหลัก' : `เลือก ${folderName}`;
        button.setAttribute('aria-label', item.isHome ? 'กลับหน้าหลัก' : `เลือก ${folderName}`);
        button.dataset.path = item.path;
        button.dataset.key = item.isHome ? 'home' : item.path;
        button.dataset.level = String(Number(item.level || 0));
        button.dataset.parentPath = item.parentPath || '';
        button.dataset.childrenLoaded = item.isHome ? 'true' : 'false';
        button.dataset.childrenRendered = item.isHome ? 'true' : 'false';
        button.dataset.hasChildren = 'false';
        button.dataset.isTreeRoot = item.isTreeRoot ? 'true' : 'false';
        button.dataset.treeLoaded = 'false';
        button.dataset.treeLoading = 'false';
        button.style.setProperty('--folder-level', String(Math.min(Number(item.level || 0), 6)));
        button.innerHTML = `
            <span class="folder-name">
                <i class="fa-solid ${escapeHtml(iconClass)}" aria-hidden="true"></i>
                <span class="folder-label">${escapeHtml(folderName)}</span>
            </span>
            <i class="fa-solid fa-chevron-right folder-toggle" aria-hidden="true" hidden></i>
            <span class="folder-path">${escapeHtml(item.path || '')}</span>
        `;
        button.addEventListener('click', async (event) => {
            const isToggleClick = Boolean(event.target.closest('.folder-toggle'));

            state.page = 1;
            setSelectedFolder(item.path, folderName, Boolean(item.isHome));
            keywordInput.value = '';
            state.currentItemCount = 0;
            state.totalItems = 0;
            state.hasKnownTotal = false;
            setResultCount(0);

            if (item.isHome) {
                selectHomeFolder();
                return;
            }

            try {
                if (item.isTreeRoot) {
                    const loaded = await loadFullFolderTree(button);

                    if (!loaded) {
                        return;
                    }

                    setSelectedFolder(item.path, folderName, false);

                    if (isToggleClick) {
                        toggleFolderChildren(item.path);
                        showSelectFolderPrompt();
                        setMessage(button.dataset.childrenRendered === 'true' ? 'เปิด folder หลักแล้ว' : 'ปิด folder หลักแล้ว');
                        updatePager(false);
                        return;
                    }

                    collapseAllFolderChildren();
                    setSelectedFolder(item.path, folderName, false);
                } else if (isToggleClick && button.dataset.hasChildren === 'true') {
                    toggleFolderChildren(item.path);
                    setSelectedFolder(item.path, folderName, false);
                    showSelectFolderPrompt();
                    setMessage(button.dataset.childrenRendered === 'true' ? 'เปิด folder ย่อยแล้ว' : 'ปิด folder ย่อยแล้ว');
                    updatePager(false);
                    return;
                }

                if (button.dataset.hasChildren === 'true' && !isToggleClick) {
                    toggleFolderChildren(item.path);
                    setSelectedFolder(item.path, folderName, false);
                }
            } catch (error) {
                setMessage(error.message, true);
                updatePager(false);
                return;
            }

            updatePager(true);
            showLoadingSpinner();

            try {
                await loadDocuments({ allowList: true });
            } catch (error) {
                setMessage(error.message, true);
                setFolderResultBadge(`${state.folderLabel || 'folder ที่เลือก'} · โหลดเอกสารไม่สำเร็จ`);
                rows.innerHTML = '<tr><td colspan="5" class="muted">โหลดข้อมูลไม่สำเร็จ</td></tr>';
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
            resetFolderResultBadge();
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
        const folderLabel = state.folderLabel || 'folder ที่เลือก';
        const loadingText = keyword
            ? `กำลังค้นหาเอกสารใน ${folderLabel}...`
            : `กำลังโหลดเอกสารใน ${folderLabel}...`;
        setMessage(loadingText);
        setFolderResultBadge(loadingText, true);
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
        const totalText = state.hasKnownTotal ? state.totalItems : items.length;
        const badgeText = keyword
            ? `${folderLabel} · พบผลการค้นหา ${totalText} รายการ`
            : `${folderLabel} · พบเอกสาร ${totalText} รายการ`;
        setFolderResultBadge(badgeText);
        updatePager(false);
        setMessage(items.length ? `${payload.message ? `${payload.message} ` : ''}${badgeText}` : 'ไม่พบเอกสาร');
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
            const keyword = keywordInput.value.trim();
            rows.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state-cell">
                        <div class="empty-state">
                            <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
                            <p>${keyword ? 'ไม่พบเอกสารที่ตรงกับคำค้น' : 'ไม่พบเอกสารใน folder นี้'}</p>
                        </div>
                    </td>
                </tr>
            `;
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
                    <td>
                        <span class="file-badge">
                            <i class="fa-solid fa-tag" aria-hidden="true"></i>
                            <span>${mimeType}</span>
                        </span>
                    </td>
                    <td>${sizeText}</td>
                    <td>
                        <button
                            type="button"
                            class="file-info-btn"
                            data-id="${id}"
                            data-name="${openName}"
                            data-size="${sizeText}"
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
                <td colspan="5" class="empty-state-cell">
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
            setFolderResultBadge(`${state.folderLabel || 'folder ที่เลือก'} · โหลดเอกสารไม่สำเร็จ`);
            rows.innerHTML = '<tr><td colspan="5" class="muted">โหลดข้อมูลไม่สำเร็จ</td></tr>';
            updatePager(false);
        });
    });

    reloadFoldersBtn.addEventListener('click', () => loadFolders().catch((error) => setMessage(error.message, true)));
    if (collapseFoldersBtn) {
        collapseFoldersBtn.addEventListener('click', () => {
            collapseAllFolderChildren();
            setMessage('ปิด folder ย่อยทั้งหมดแล้ว');
        });
    }

    if (folderCrumb) {
        folderCrumb.addEventListener('click', (event) => {
            const button = event.target.closest('.breadcrumb-action');

            if (!button) {
                return;
            }

            selectBreadcrumbFolder(button.dataset.path || '', button.dataset.label || '', button.dataset.home === 'true');
        });
    }

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
