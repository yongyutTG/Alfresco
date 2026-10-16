(function (global) {
    'use strict';

    const pathKey = (path) => String(path || '').replace(/\/+$/, '') || '/';
    const within = (path, parent) => pathKey(path) === pathKey(parent)
        || pathKey(path).startsWith(`${pathKey(parent) === '/' ? '' : pathKey(parent)}/`);

    function topLevelFolders(items) {
        return items.filter((item) => !items.some((parent) => parent.id !== item.id && within(item.path, parent.path)));
    }

    function validTarget(path, root, items, kind) {
        if (!path || !within(path, root)) return false;
        return items.every((item) => pathKey(path) !== pathKey(item.parentPath)
            && (kind !== 'folders' || !within(path, item.path)));
    }

    function displayFolderPath(path, root) {
        const normalizedPath = pathKey(path);
        const normalizedRoot = pathKey(root);
        if (!normalizedPath || normalizedPath === normalizedRoot) return 'คลังเอกสาร';
        const relative = normalizedPath.startsWith(`${normalizedRoot}/`)
            ? normalizedPath.slice(normalizedRoot.length + 1)
            : normalizedPath.replace(/^\/+/, '');
        return relative.split('/').filter(Boolean).join(' / ') || 'คลังเอกสาร';
    }

    function canSelectDocument(item) {
        const moveDenied = item?.allowMove === false || item?.canMove === false || item?.permissions?.canMove === false;
        const deleteDenied = item?.allowDelete === false || item?.canDelete === false || item?.permissions?.canDelete === false;
        return !moveDenied || !deleteDenied;
    }

    function resultItems(items, payload, operation) {
        const results = Array.isArray(payload?.results) ? payload.results : [];
        return items.map((item) => {
            const matches = results.filter((result) => String(result.id) === item.id);
            const result = matches.length === 1 ? matches[0] : null;
            const ok = result?.ok === true && result?.[operation === 'delete' ? 'deleted' : 'moved'] === true;
            return { ...item, ok, error: ok ? '' : String(result?.error || 'ไม่สามารถยืนยันผลได้ กรุณาโหลดรายการใหม่เพื่อตรวจสอบก่อนลองอีกครั้ง') };
        });
    }

    function init({ rootPath, requestJson, refresh }) {
        const get = (id) => document.getElementById(id);
        const ui = Object.fromEntries(['Modal', 'Form', 'Title', 'Description', 'Items', 'Destination', 'FolderSearch', 'Target', 'TargetPath', 'DeleteIcon', 'DeleteWarning', 'SelectedTitle', 'Status', 'Results', 'Confirm', 'Cancel', 'FolderMode', 'FolderPanel', 'FolderChoices', 'FolderCount', 'MoveFolders', 'ClearFolders', 'DocumentActions', 'DocumentCount', 'MoveDocuments', 'DeleteDocuments', 'ClearDocuments', 'SelectPage'].map((key) => [key, get(`bulk${key}`)]));
        const documents = new Map();
        const folders = new Map();
        let catalog = [];
        let pageItems = [];
        let context = '';
        let folderMode = false;
        let active = null;
        let busy = false;
        let opener = null;
        const selection = () => active?.kind === 'folders' ? folders : documents;
        const itemId = (item) => String(item.id || '');

        function update() {
            ui.DocumentActions.hidden = !documents.size;
            ui.DocumentCount.textContent = `เลือกแล้ว ${documents.size} ไฟล์`;
            ui.FolderCount.textContent = `เลือก ${folders.size} โฟลเดอร์`;
            ui.MoveFolders.disabled = !folders.size || busy;
            ui.DeleteDocuments.disabled = !documents.size || busy || [...documents.values()].some((item) => item.permissions?.canDelete === false || item.allowDelete === false);
            ui.DeleteDocuments.title = ui.DeleteDocuments.disabled && documents.size ? 'บางรายการไม่มีสิทธิ์ลบ' : 'ลบไฟล์ที่เลือก';
            ui.MoveDocuments.disabled = !documents.size || busy || [...documents.values()].some((item) => item.allowMove === false || item.permissions?.canMove === false);
            const selectable = pageItems.filter((item) => itemId(item) && canSelectDocument(item));
            const count = selectable.filter((item) => documents.has(itemId(item))).length;
            ui.SelectPage.hidden = !selectable.length;
            ui.SelectPage.checked = selectable.length > 0 && count === selectable.length;
            ui.SelectPage.indeterminate = count > 0 && count < selectable.length;
            ui.SelectPage.disabled = !selectable.length || busy || folderMode;
            document.querySelectorAll('.bulk-document-check').forEach((input) => {
                const item = pageItems.find((entry) => itemId(entry) === input.dataset.id);
                const selectableItem = Boolean(item && canSelectDocument(item));
                input.checked = documents.has(input.dataset.id);
                input.hidden = !selectableItem;
                input.disabled = busy || folderMode || !selectableItem;
            });
        }

        function drawFolders() {
            // The catalog is needed for move destinations, but its checkbox DOM is not
            // needed until the user opens folder selection.
            if (!folderMode) return;
            ui.FolderChoices.replaceChildren();
            for (const item of catalog) {
                if (!item.id || pathKey(item.path) === pathKey(rootPath)) continue;
                const label = document.createElement('label');
                label.className = 'bulk-folder-choice';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'bulk-checkbox';
                input.checked = folders.has(item.id);
                input.disabled = item.allowMove === false || item.permissions?.canMove === false || [...folders.values()].some((parent) => parent.id !== item.id && within(item.path, parent.path));
                const text = document.createElement('span');
                text.textContent = displayFolderPath(item.path, rootPath);
                input.addEventListener('change', () => {
                    if (input.checked) {
                        for (const [id, child] of folders) if (within(child.path, item.path)) folders.delete(id);
                        folders.set(item.id, item);
                    } else folders.delete(item.id);
                    drawFolders();
                    update();
                });
                label.append(input, text);
                ui.FolderChoices.append(label);
            }
            if (!ui.FolderChoices.children.length) ui.FolderChoices.textContent = 'ไม่มีโฟลเดอร์ที่เลือกย้ายได้ หรือยังโหลดรายการไม่สำเร็จ';
        }

        function setFolderMode(enabled) {
            folderMode = enabled;
            documents.clear();
            if (!enabled) folders.clear();
            if (!enabled) ui.FolderChoices.replaceChildren();
            ui.FolderPanel.hidden = !enabled;
            ui.FolderMode.setAttribute('aria-expanded', String(enabled));
            ui.FolderMode.textContent = enabled ? 'เลิกเลือกโฟลเดอร์' : 'เลือกโฟลเดอร์เพื่อย้าย';
            drawFolders();
            update();
        }

        function drawTargets() {
            const previous = ui.Target.value;
            const query = ui.FolderSearch.value.trim().toLocaleLowerCase();
            ui.Target.replaceChildren();
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = '— เลือกโฟลเดอร์ปลายทาง —';
            ui.Target.append(placeholder);
            for (const item of catalog) {
                const displayName = displayFolderPath(item.path, rootPath);
                const searchText = `${displayName} ${item.path}`.toLocaleLowerCase();
                if (query && !searchText.includes(query)) continue;
                const option = document.createElement('option');
                option.value = item.path;
                option.textContent = displayName;
                option.title = item.path;
                option.disabled = !validTarget(item.path, rootPath, active.items, active.kind);
                ui.Target.append(option);
            }
            ui.Target.value = [...ui.Target.options].some((option) => option.value === previous && !option.disabled) ? previous : '';
            targetChanged();
        }

        function targetChanged() {
            const unit = active?.kind === 'folders' ? 'โฟลเดอร์' : 'ไฟล์';
            ui.TargetPath.textContent = ui.Target.value
                ? `พร้อมย้าย ${active?.items?.length || 0} ${unit} ไปยัง ${displayFolderPath(ui.Target.value, rootPath)}`
                : 'กรุณาเลือกโฟลเดอร์ปลายทาง';
            ui.Confirm.disabled = busy || !active || (active.operation === 'move' && !validTarget(ui.Target.value, rootPath, active.items, active.kind));
        }

        function open(kind, operation) {
            if (busy) return;
            let items = [...(kind === 'folders' ? folders : documents).values()];
            if (kind === 'folders') items = topLevelFolders(items);
            if (!items.length) return;
            opener = document.activeElement;
            active = { kind, operation, items: items.map((item) => ({ ...item })) };
            const label = operation === 'delete' ? 'ลบไฟล์' : kind === 'folders' ? 'ย้ายโฟลเดอร์' : 'ย้ายไฟล์';
            const isDelete = operation === 'delete';
            ui.Form.classList.toggle('bulk-delete-mode', isDelete);
            ui.DeleteIcon.hidden = !isDelete;
            ui.DeleteWarning.hidden = !isDelete;
            ui.SelectedTitle.innerHTML = isDelete
                ? '<i class="fa-regular fa-file-lines" aria-hidden="true"></i> รายการไฟล์ที่จะลบ'
                : '<i class="fa-regular fa-file-lines" aria-hidden="true"></i> รายการที่เลือก';
            ui.Title.textContent = isDelete ? 'ยืนยันการลบไฟล์' : `${label} ${items.length} รายการ`;
            ui.Description.textContent = isDelete
                ? `คุณกำลังจะลบไฟล์ ${items.length} รายการ กรุณาตรวจสอบก่อนยืนยัน`
                : 'ตรวจสอบรายการที่เลือกทางซ้าย แล้วเลือกโฟลเดอร์ปลายทางทางขวา';
            ui.Items.replaceChildren();
            items.forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item.name || item.path || item.parentPath || 'ไม่พบชื่อรายการ';
                ui.Items.append(li);
            });
            ui.Results.hidden = true;
            ui.Results.replaceChildren();
            ui.Status.textContent = '';
            ui.Destination.hidden = isDelete;
            ui.TargetPath.hidden = isDelete;
            ui.Confirm.hidden = false;
            ui.Confirm.textContent = isDelete ? `ลบไฟล์ ${items.length} รายการ` : `ยืนยัน${label} ${items.length} รายการ`;
            ui.Confirm.classList.toggle('danger-btn', isDelete);
            ui.Cancel.textContent = 'ยกเลิก';
            ui.FolderSearch.value = '';
            ui.Target.value = '';
            drawTargets();
            ui.Modal.hidden = false;
            (isDelete ? ui.Cancel : ui.FolderSearch).focus();
        }

        function close() {
            if (busy) return;
            ui.Modal.hidden = true;
            active = null;
            if (opener?.isConnected && !opener.disabled) opener.focus();
            else get('reloadFoldersBtn').focus();
        }

        ui.Form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!active || busy || ui.Confirm.hidden || ui.Confirm.disabled) return;
            const { kind, operation, items } = active;
            const targetFolderPath = ui.Target.value;
            if (operation === 'move' && !validTarget(targetFolderPath, rootPath, items, kind)) return;
            const body = { [kind]: items.map(({ id, name }) => ({ id, name })) };
            if (operation === 'move') body.targetFolderPath = targetFolderPath;
            busy = true;
            ui.Form.setAttribute('aria-busy', 'true');
            ui.Confirm.disabled = ui.Cancel.disabled = ui.Target.disabled = ui.FolderSearch.disabled = true;
            ui.Status.textContent = 'กำลังดำเนินการ กรุณารอ...';
            // Keep background navigation and other mutations unavailable during the operation.
            document.querySelector('main').inert = true;
            document.querySelector('header').inert = true;
            update();
            try {
                const payload = await requestJson(`/user-api/alfresco/${kind}/bulk-${operation}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                });
                const results = resultItems(items, payload, operation);
                results.forEach((item) => {
                    if (item.ok) selection().delete(item.id);
                    const li = document.createElement('li');
                    li.textContent = `${item.name}: ${item.ok ? 'สำเร็จ' : item.error}`;
                    li.className = item.ok ? 'bulk-success' : 'bulk-error';
                    ui.Results.append(li);
                });
                ui.Results.hidden = false;
                const succeeded = results.filter((item) => item.ok);
                ui.Status.textContent = `สำเร็จ ${succeeded.length} รายการ · ไม่สำเร็จหรือยังยืนยันผลไม่ได้ ${results.length - succeeded.length} รายการ`;
                try {
                    await refresh({ kind, succeeded });
                } catch (error) {
                    ui.Status.textContent += ' · โหลดรายการใหม่ไม่สำเร็จ กรุณารีโหลดเพื่อตรวจสอบ';
                }
            } catch (error) {
                ui.Status.textContent = `${error.message || 'ติดต่อ API ไม่สำเร็จ'} · ผลบางรายการอาจดำเนินการแล้ว กรุณาโหลดรายการใหม่เพื่อตรวจสอบก่อนลองอีกครั้ง`;
            } finally {
                busy = false;
                ui.Form.setAttribute('aria-busy', 'false');
                ui.Confirm.hidden = true;
                ui.Cancel.disabled = ui.Target.disabled = ui.FolderSearch.disabled = false;
                ui.Cancel.textContent = 'ปิด';
                document.querySelector('main').inert = false;
                document.querySelector('header').inert = false;
                drawFolders();
                update();
                ui.Cancel.focus();
            }
        });

        ui.FolderMode.addEventListener('click', () => setFolderMode(!folderMode));
        ui.ClearFolders.addEventListener('click', () => { folders.clear(); drawFolders(); update(); });
        ui.ClearDocuments.addEventListener('click', () => { documents.clear(); update(); });
        ui.MoveFolders.addEventListener('click', () => open('folders', 'move'));
        ui.MoveDocuments.addEventListener('click', () => open('documents', 'move'));
        ui.DeleteDocuments.addEventListener('click', () => open('documents', 'delete'));
        ui.FolderSearch.addEventListener('input', drawTargets);
        ui.Target.addEventListener('change', targetChanged);
        ui.Cancel.addEventListener('click', close);
        ui.Modal.addEventListener('click', (event) => { if (event.target === ui.Modal) close(); });
        ui.Modal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') { event.preventDefault(); close(); }
            if (event.key !== 'Tab') return;
            const controls = [...ui.Form.querySelectorAll('input, select, button')].filter((el) => !el.disabled && !el.hidden && !el.closest('[hidden]'));
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (!first || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
                event.preventDefault();
                (event.shiftKey ? last : first)?.focus();
            }
        });
        ui.SelectPage.addEventListener('change', () => {
            if (folderMode || busy) return;
            pageItems.filter((item) => itemId(item) && canSelectDocument(item)).forEach((item) => {
                if (ui.SelectPage.checked) documents.set(itemId(item), item);
                else documents.delete(itemId(item));
            });
            update();
        });
        get('documentRows').addEventListener('change', (event) => {
            const input = event.target.closest('.bulk-document-check');
            if (!input || folderMode || busy) return;
            const item = pageItems.find((entry) => entry.id === input.dataset.id);
            if (!item || !canSelectDocument(item)) return;
            if (input.checked) documents.set(item.id, item);
            else documents.delete(item.id);
            update();
        });

        return {
            setContext(path, keyword) {
                const next = JSON.stringify([path, keyword]);
                if (next !== context) {
                    documents.clear();
                    if (!context || JSON.parse(context)[0] !== path) pageItems = [];
                    context = next;
                    update();
                }
            },
            setFolders(items) {
                catalog = [{ path: pathKey(rootPath), name: 'คลังเอกสาร' }, ...items.filter((item) => item.path && within(item.path, rootPath)).map((item) => ({ ...item, id: itemId(item), parentPath: item.parentPath || pathKey(item.path).slice(0, pathKey(item.path).lastIndexOf('/')) || '/' }))];
                drawFolders();
            },
            setDocuments(items, parentPath) {
                pageItems = items.map((item) => ({ ...item, id: itemId(item), parentPath: item.parentPath || parentPath }));
                // Refresh metadata of selected files without losing selections on other pages.
                pageItems.forEach((item) => {
                    if (!documents.has(item.id)) return;
                    if (canSelectDocument(item)) documents.set(item.id, item);
                    else documents.delete(item.id);
                });
                update();
            },
        };
    }

    if (typeof module !== 'undefined' && module.exports) module.exports = { topLevelFolders, validTarget, displayFolderPath, canSelectDocument, resultItems };
    else global.AlfrescoBulk = { init };
})(typeof window === 'undefined' ? globalThis : window);
