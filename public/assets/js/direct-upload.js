(function () {
    window.createDocumentUploader = function ({ request, refresh, notifySuccess = () => {}, notifyError = () => {} }) {
        const get = (id) => document.getElementById(id);
        const dialog = get('uploadDialog');
        const input = get('uploadFiles');
        const start = get('uploadStart');
        const stop = get('uploadStop');
        const retry = get('uploadRetry');
        const close = get('uploadClose');
        const trigger = get('uploadFilePlaceholderBtn');
        const status = get('uploadStatus');
        const progress = get('uploadProgress');
        const choose = get('uploadChoose');
        const dropZone = get('uploadDropZone');
        const notice = get('uploadNotice');
        const bytes = (size) => size < 1024 * 1024 ? (size / 1024).toFixed(1) + ' KB' : (size / 1024 / 1024).toFixed(1) + ' MB';
        let selectedPath = '', target = '';
        let allowed = false, busy = false;
        let stopRequested = false, paused = false;
        let entries = [];
        function render() {
            const list = get('uploadResults');
            list.replaceChildren();
            const labels = { invalid: 'ไฟล์ไม่ถูกต้อง', pending: 'รอส่ง', sending: 'กำลังอัปโหลด', success: 'สำเร็จ', failed: 'ไม่สำเร็จ', unknown: 'ไม่ทราบผล โปรดตรวจไฟล์ปลายทางก่อนส่งซ้ำ' };
            entries.forEach((entry) => {
                const row = document.createElement('li');
                row.className = 'upload-file-row upload-file-row-' + entry.state;
                const name = document.createElement('div');
                name.className = 'upload-file-name';
                const fileIcon = document.createElement('i');
                const extension = entry.file.name.split('.').pop().toLowerCase();
                const iconType = { pdf: 'file-pdf', xlsx: 'file-excel', xls: 'file-excel', doc: 'file-word', docx: 'file-word', jpg: 'file-image', jpeg: 'file-image', png: 'file-image' }[extension] || 'file';
                fileIcon.className = 'fa-regular fa-' + iconType;
                fileIcon.setAttribute('aria-hidden', 'true');
                const filename = document.createElement('span');
                filename.textContent = entry.file.name;
                name.append(fileIcon, filename);
                const size = document.createElement('div');
                size.className = 'upload-file-size';
                size.textContent = bytes(entry.file.size);
                const result = document.createElement('div');
                result.className = 'upload-file-result';
                const badge = document.createElement('span');
                badge.className = 'upload-state upload-state-' + entry.state;
                badge.textContent = labels[entry.state];
                const stateIcon = document.createElement('i');
                stateIcon.className = {
                    pending: 'fa-regular fa-clock',
                    sending: 'fa-solid fa-spinner fa-spin',
                    success: 'fa-solid fa-circle-check',
                    failed: 'fa-solid fa-circle-exclamation',
                    invalid: 'fa-solid fa-circle-exclamation',
                    unknown: 'fa-solid fa-triangle-exclamation',
                }[entry.state];
                stateIcon.setAttribute('aria-hidden', 'true');
                badge.append(stateIcon);
                result.append(badge);
                if (entry.error) {
                    const error = document.createElement('small');
                    error.textContent = entry.error;
                    result.append(error);
                }
                const action = document.createElement('div');
                action.className = 'upload-file-action';
                if (entry.state !== 'success') {
                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'upload-remove secondary-btn';
                    remove.title = 'นำ ' + entry.file.name + ' ออกจากรายการ';
                    remove.setAttribute('aria-label', remove.title);
                    const icon = document.createElement('i');
                    icon.className = 'fa-solid fa-xmark';
                    icon.setAttribute('aria-hidden', 'true');
                    remove.append(icon);
                    remove.disabled = busy;
                    remove.addEventListener('click', () => {
                        if (busy) return;
                        entries = entries.filter((item) => item !== entry);
                        render();
                        choose.focus();
                    });
                    action.append(remove);
                }
                row.append(name, size, result, action);
                list.append(row);
            });
            get('uploadCount').textContent = entries.length ? entries.length + ' ไฟล์ · ' + bytes(entries.reduce((total, entry) => total + entry.file.size, 0)) : 'ยังไม่ได้เลือกไฟล์';
            dropZone.classList.toggle('has-files', entries.length > 0);
            const pendingCount = entries.filter((entry) => entry.state === 'pending').length;
            start.textContent = busy ? 'กำลังอัปโหลด...' : (paused ? 'ทำต่ออีก' : 'อัปโหลด') + (pendingCount ? ' ' + pendingCount + ' ไฟล์' : '');
            stop.hidden = !busy;
            stop.disabled = stopRequested || !entries.some((entry) => entry.state === 'sending');
            choose.replaceChildren();
            const addIcon = document.createElement('i');
            addIcon.className = 'fa-solid fa-plus';
            addIcon.setAttribute('aria-hidden', 'true');
            const addLabel = document.createElement('span');
            addLabel.textContent = entries.length ? 'เพิ่มไฟล์' : 'เลือกไฟล์';
            choose.append(addIcon, addLabel);
            choose.disabled = busy;
            progress.hidden = !entries.some((entry) => !['pending', 'invalid'].includes(entry.state));
            progress.max = entries.length || 1;
            progress.value = entries.filter((e) => ['success', 'failed', 'unknown'].includes(e.state)).length;
            start.disabled = busy || !entries.some((e) => e.state === 'pending');
            retry.hidden = !entries.some((e) => e.state === 'failed');
            retry.disabled = busy;
            input.disabled = busy;
            close.disabled = busy;
            close.textContent = entries.length && entries.every((entry) => entry.state === 'success') ? 'เสร็จสิ้น' : 'ปิด';
            dialog.setAttribute('aria-busy', String(busy));
        }
        trigger.addEventListener('click', () => {
            if (!allowed || busy) return;
            target = selectedPath;
            get('uploadTarget').textContent = target.split('/').filter(Boolean).pop() || '/';
            entries = [];
            stopRequested = false;
            paused = false;
            input.value = '';
            status.textContent = '';
            notice.hidden = true;
            render();
            dialog.hidden = false;
            choose.focus();
        });
        function closeDialog() {
            if (busy) return;
            dialog.hidden = true;
            trigger.focus();
        }
        close.addEventListener('click', closeDialog);
        stop.addEventListener('click', () => {
            if (!busy || stopRequested) return;
            stopRequested = true;
            status.textContent = 'กำลังรอผลไฟล์ปัจจุบัน แล้วจะหยุดส่งไฟล์ที่เหลือ';
            render();
        });
        // Preserve selected files when the user accidentally clicks the backdrop.
        dialog.addEventListener('click', (event) => { if (event.target === dialog) event.preventDefault(); });
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); return; }
            if (event.key === 'Tab') {
                const controls = [...dialog.querySelectorAll('button:not([disabled]):not([hidden])')];
                if (!controls.length) { event.preventDefault(); return; }
                const first = controls[0], last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });
        window.addEventListener('beforeunload', (event) => { if (busy) { event.preventDefault(); event.returnValue = ''; } });
        function addFiles(files) {
            if (busy) return;
            notice.hidden = true;
            if (entries.length + files.length > 100) {
                notice.textContent = 'เลือกได้สูงสุด 100 ไฟล์ กรุณาลดจำนวนไฟล์ที่เพิ่ม';
                notice.hidden = false;
                return;
            }
            let duplicates = 0;
            files.forEach((file) => {
                if (entries.some((entry) => entry.file.name === file.name)) { duplicates++; return; }
                const error = !file.size ? 'ไฟล์ว่าง' : file.size > 25 * 1024 * 1024 ? 'ขนาดเกิน 25 MiB' : '';
                entries.push({ file, state: error ? 'invalid' : 'pending', error });
            });
            if (duplicates) {
                notice.textContent = 'ไม่ได้เพิ่มไฟล์ชื่อซ้ำ ' + duplicates + ' ไฟล์';
                notice.hidden = false;
            }
            render();
        }
        choose.addEventListener('click', () => input.click());
        input.addEventListener('change', () => {
            addFiles(Array.from(input.files));
            input.value = '';
        });
        ['dragenter', 'dragover'].forEach((name) => dropZone.addEventListener(name, (event) => {
            event.preventDefault();
            if (!busy) dropZone.classList.add('drag-active');
        }));
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
        dropZone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropZone.classList.remove('drag-active');
            addFiles(Array.from(event.dataTransfer.files));
        });
        async function run(mode) {
            if (busy) return;
            const pending = entries.filter((e) => e.state === mode);
            if (!pending.length) return;
            const uploadedFolderPath = target;
            stopRequested = false;
            paused = false;
            busy = true;
            try {
                // Single-file responses confirm completion before starting the next file.
                for (const entry of pending) {
                    if (stopRequested) break;
                    const body = new FormData();
                    body.append('folderPath', target);
                    entry.state = 'sending';
                    entry.error = '';
                    body.append('file', entry.file);
                    status.textContent = 'สำเร็จ ' + entries.filter((item) => item.state === 'success').length + ' จาก ' + entries.length + ' ไฟล์ · กำลังส่ง ' + entry.file.name;
                    render();
                    try {
                        const item = await request(body);
                        if (item?.ok && item.document?.id) entry.document = item.document;
                        entry.state = item?.ok ? 'success' : 'unknown';
                        entry.error = item?.error || '';
                        if (entry.state === 'unknown') break;
                    } catch (error) {
                        // Lost responses can follow successful writes; never replay unknown results.
                        const rejected = [400, 401, 403, 404, 409, 413, 415, 429].includes(error.status);
                        entry.state = rejected ? 'failed' : 'unknown';
                        entry.error = error.payload?.error || error.message;
                        if (typeof entry.error !== 'string') entry.error = error.message;
                        if (!rejected || [401, 403, 429].includes(error.status)) break;
                    }
                    render();
                }
            } finally {
                paused = stopRequested && entries.some((entry) => ['pending', 'failed'].includes(entry.state));
                status.textContent = (paused ? 'หยุดแล้ว · ' : '') + 'สำเร็จ ' + entries.filter((e) => e.state === 'success').length + ' / ' + entries.length + ' ไฟล์' + (paused ? ' · รอส่ง ' + entries.filter((entry) => entry.state === 'pending').length + ' ไฟล์' : '');
                render();
                if (entries.length && entries.every((entry) => entry.state === 'success')) {
                    notifySuccess('อัปโหลดสำเร็จ ' + entries.length + ' ไฟล์');
                }
                try { await refresh(uploadedFolderPath, entries.filter((entry) => entry.state === 'success' && entry.document).map((entry) => entry.document)); } catch (_) {
                    const message = 'รีเฟรชรายการไม่สำเร็จ กรุณากดรีเฟรชอีกครั้ง';
                    status.textContent += ' (' + message + ')';
                    notifyError(message);
                } finally {
                    busy = false;
                    render();
                    if (paused) (start.disabled ? retry : start).focus();
                }
            }
        }
        start.addEventListener('click', () => run('pending'));
        retry.addEventListener('click', () => run('failed'));
        return { setFolder(path, canUpload) { selectedPath = path; allowed = canUpload; trigger.hidden = !canUpload; } };
    };
}());
