(function () {
    const config = window.UserAlfrescoCi4;
    const state = {
        folderPath: config.rootPath,
        page: 1,
        lastCount: 0,
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

    function setMessage(text, isError) {
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
        selectedFolder.textContent = formatDisplayPath(path);

        document.querySelectorAll('.folder-item').forEach((button) => {
            button.classList.toggle('active', button.dataset.path === path);
        });
    }

    async function requestJson(url) {
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
        });

        if (response.status === 401) {
            window.location.href = '/login';
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'เรียก API ไม่สำเร็จ');
        }

        return data;
    }

    function pickItems(payload) {
        if (Array.isArray(payload)) {
            return payload;
        }

        if (Array.isArray(payload.items)) {
            return payload.items;
        }

        if (Array.isArray(payload.files)) {
            return payload.files;
        }

        if (payload.data && Array.isArray(payload.data.items)) {
            return payload.data.items;
        }

        if (payload.data && Array.isArray(payload.data.files)) {
            return payload.data.files;
        }

        if (payload.list && Array.isArray(payload.list.entries)) {
            return payload.list.entries.map((entry) => entry.entry || entry);
        }

        return [];
    }

    async function loadFolders() {
        setMessage('กำลังโหลด folder ตามสิทธิ์...');
        folderList.innerHTML = '';

        const url = new URL(config.endpoints.folders, window.location.origin);
        url.searchParams.set('path', config.rootPath);

        const payload = await requestJson(url);
        const items = pickItems(payload)
            .filter((item) => item.isFolder || item.type === 'cmis:folder')
            .filter((item) => (item.name || '').toLowerCase() !== 'sites');

        const rootButton = createFolderButton({
            name: 'documentLibrary',
            path: config.rootPath,
        });
        folderList.appendChild(rootButton);

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
            <span class="folder-path">${escapeHtml(formatDisplayPath(item.path || ''))}</span>
        `;
        button.addEventListener('click', () => {
            state.page = 1;
            setSelectedFolder(item.path);
            rows.innerHTML = '';
            setResultCount(0);
            setMessage('เลือก folder แล้ว กดค้นหาเพื่อดึงเอกสาร');
            updatePager();
        });

        return button;
    }

    async function loadDocuments() {
        const maxItems = Number(pageSizeInput.value || 100);
        const skipCount = (state.page - 1) * maxItems;

        setMessage('กำลังดึงเอกสาร...');
        rows.innerHTML = '';
        updatePager(true);

        const url = new URL(config.endpoints.documents, window.location.origin);
        url.searchParams.set('folderPath', state.folderPath);
        url.searchParams.set('q', keywordInput.value.trim());
        url.searchParams.set('maxItems', String(maxItems));
        url.searchParams.set('skipCount', String(skipCount));

        const payload = await requestJson(url);
        const items = pickItems(payload).filter((item) => item.isDocument !== false && item.type !== 'cmis:folder');
        state.lastCount = items.length;
        state.hasMoreItems = Boolean(payload && payload.hasMoreItems);

        renderRows(items);
        setResultCount(items.length);
        updatePager(false);
        setMessage(items.length ? `พบเอกสาร ${items.length} รายการ` : 'ไม่พบเอกสาร');
    }

    function renderRows(items) {
        if (!items.length) {
            rows.innerHTML = '<tr><td colspan="5" class="muted">ไม่มีข้อมูล</td></tr>';
            return;
        }

        rows.innerHTML = items.map((item) => {
            const name = escapeHtml(item.name || '-');
            const mimeType = escapeHtml(item.mimeType || item.contentStreamMimeType || '-');
            const size = formatSize(item.size || item.contentStreamLength);
            const createdBy = escapeHtml(item.createdBy || '-');
            const createdDate = escapeHtml(formatDate(item.creationDate));
            const openUrl = `${config.endpoints.contentBase}/${encodeURIComponent(item.id)}/content?name=${encodeURIComponent(item.name || 'file.pdf')}`;

            return `
                <tr>
                    <td>
                        <div class="file-name">${name}</div>
                        <div class="file-meta">ผู้สร้าง: ${createdBy} · วันที่สร้าง: ${createdDate}</div>
                    </td>
                    <td><span class="file-badge">${mimeType}</span></td>
                    <td>${size}</td>
                    <td><a class="open-link" href="${openUrl}" target="_blank" rel="noopener">เปิดไฟล์</a></td>
                </tr>
            `;
        }).join('');
    }

    function updatePager(isLoading) {
        pageInfo.textContent = `หน้า ${state.page}`;
        firstBtn.disabled = isLoading || state.page <= 1;
        prevBtn.disabled = isLoading || state.page <= 1;
        nextBtn.disabled = isLoading || !state.hasMoreItems;
    }

    function formatSize(bytes) {
        const value = Number(bytes || 0);

        if (!value) {
            return '-';
        }

        if (value < 1024) {
            return `${value} B`;
        }

        if (value < 1024 * 1024) {
            return `${(value / 1024).toFixed(1)} KB`;
        }

        return `${(value / 1024 / 1024).toFixed(1)} MB`;
    }

    function formatDate(value) {
        if (!value) {
            return '-';
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function formatDisplayPath(path) {
        return String(path || '') || '/';
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

        try {
            await loadDocuments();
        } catch (error) {
            setMessage(error.message, true);
            updatePager(false);
        }
    });

    clearBtn.addEventListener('click', () => {
        keywordInput.value = '';
        state.page = 1;
        rows.innerHTML = '';
        setResultCount(0);
        setMessage('ล้างคำค้นแล้ว กดค้นหาเพื่อดึงเอกสาร');
        updatePager(false);
    });

    reloadFoldersBtn.addEventListener('click', async () => {
        try {
            await loadFolders();
        } catch (error) {
            setMessage(error.message, true);
        }
    });

    firstBtn.addEventListener('click', async () => {
        state.page = 1;
        await loadDocuments();
    });

    prevBtn.addEventListener('click', async () => {
        state.page = Math.max(1, state.page - 1);
        await loadDocuments();
    });

    nextBtn.addEventListener('click', async () => {
        state.page += 1;
        await loadDocuments();
    });

    setSelectedFolder(config.rootPath);
    updatePager(false);
    loadFolders().catch((error) => setMessage(error.message, true));
})();
