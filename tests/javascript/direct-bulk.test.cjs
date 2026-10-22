const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { topLevelFolders, validTarget, displayFolderPath, canSelectDocument, resultItems } = require('../../public/assets/js/direct-bulk.js');

test('folder selections collapse descendants and destinations respect path boundaries', () => {
    const parent = { id: 'a', path: '/root/a', parentPath: '/root' };
    const child = { id: 'b', path: '/root/a/b', parentPath: '/root/a' };
    assert.deepEqual(topLevelFolders([child, parent]), [parent]);
    for (const path of ['/root', '/root/a', '/root/a/b', '/root-other']) {
        assert.equal(validTarget(path, '/root', [parent], 'folders'), false);
    }
    assert.equal(validTarget('/root/ab', '/root', [parent], 'folders'), true);
});

test('only explicit matching success removes an item; missing and duplicate results remain uncertain', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const payload = { results: [{ id: 'a', ok: true, deleted: true }, { id: 'b', ok: true, deleted: true }, { id: 'b', ok: true, deleted: true }] };
    assert.deepEqual(resultItems(items, payload, 'delete').map((item) => item.ok), [true, false, false]);
    assert.equal(resultItems(items, {}, 'move').every((item) => !item.ok), true);
});

test('folder paths are shown as readable names without the Alfresco root path', () => {
    assert.equal(displayFolderPath('/root', '/root'), 'คลังเอกสาร');
    assert.equal(displayFolderPath('/root/การเงิน', '/root'), 'การเงิน');
    assert.equal(displayFolderPath('/root/การเงิน/สินเชื่อ', '/root'), 'การเงิน / สินเชื่อ');
});

test('documents denied both move and delete permissions cannot be selected', () => {
    assert.equal(canSelectDocument({ allowMove: false, allowDelete: false }), false);
    assert.equal(canSelectDocument({ permissions: { canMove: false, canDelete: false } }), false);
    assert.equal(canSelectDocument({ allowMove: true, allowDelete: false }), true);
    assert.equal(canSelectDocument({}), true);
});

function harness(request) {
    const elements = new Map();
    const document = {
        activeElement: null,
        getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); },
        createElement() { return new Element(); },
        querySelector(selector) { return this.getElementById(selector); },
        querySelectorAll() { return []; },
        addEventListener() {},
    };
    class Element {
        constructor() { this.events = {}; this.children = []; this.dataset = {}; this.value = ''; this.hidden = false; this.disabled = false; this.isConnected = true; this.classList = { toggle() {} }; }
        addEventListener(name, callback) { this.events[name] = callback; }
        setAttribute() {}
        replaceChildren() { this.children = []; }
        append(...nodes) { this.children.push(...nodes); }
        get options() { return this.children; }
        focus() { document.activeElement = this; }
        querySelector() { return this.children.find((child) => !child.disabled) || null; }
        querySelectorAll() { return []; }
        contains(target) { return target === this || this.children.includes(target); }
        emit(name) { return this.events[name]({ preventDefault() {}, stopPropagation() {}, target: this }); }
    }
    const context = { window: {}, document };
    vm.runInNewContext(fs.readFileSync(require.resolve('../../public/assets/js/direct-bulk.js'), 'utf8'), context);
    const requests = [];
    const refreshes = [];
    const downloads = [];
    const api = context.window.AlfrescoBulk.init({ rootPath: '/root', requestJson: async (path, options) => {
        requests.push({ path, body: options.body ? JSON.parse(options.body) : undefined, method: options.method });
        return request ? request() : { results: [{ id: '1', ok: true, moved: true }] };
    }, refresh: async (result) => refreshes.push(result), download: async (items) => downloads.push(items) });
    const get = (name) => document.getElementById(`bulk${name}`);
    api.setContext('/root/source', '');
    api.setFolders([{ id: 'f', name: 'source', path: '/root/source', parentPath: '/root' }, { id: 't', name: 'target', path: '/root/target', parentPath: '/root' }]);
    function select(items = [{ id: '1', name: '<file>.pdf' }]) {
        api.setDocuments(items, '/root/source');
        get('SelectPage').checked = true;
        get('SelectPage').emit('change');
    }
    return { api, get, select, requests, refreshes, downloads, document };
}

test('selected document actions appear in the selection toolbar', () => {
    const h = harness();
    h.select([{ id: '1', name: 'one' }, { id: '2', name: 'two' }]);
    assert.equal(h.get('DocumentCount').textContent, 'เลือกแล้ว 2 ไฟล์');
    h.get('ClearDocuments').emit('click');
    assert.equal(h.get('DocumentActions').hidden, true);
});
test('backdrop and Escape do not dismiss selected-file confirmation', () => {
    const h = harness();
    h.select();
    h.get('DeleteDocuments').emit('click');
    h.get('Modal').emit('click');
    h.get('Modal').events.keydown({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
    assert.equal(h.get('Modal').hidden, false);
    assert.equal(h.get('Items').children.length, 1);
    assert.equal(h.requests.length, 0);
    h.get('Cancel').emit('click');
    assert.equal(h.get('Modal').hidden, true);
});

test('selected documents are passed to the bulk download handler', async () => {
    const h = harness();
    h.select([{ id: '1', name: 'one.pdf', permissions: { canDownload: true } }, { id: '2', name: 'two.pdf', permissions: { canDownload: true } }]);
    await h.get('DownloadDocuments').emit('click');
    assert.equal(JSON.stringify(h.downloads[0].map(({ id, name }) => ({ id, name }))), JSON.stringify([
        { id: '1', name: 'one.pdf' },
        { id: '2', name: 'two.pdf' },
    ]));
    assert.equal(h.get('DownloadDocuments').disabled, false);
});

test('bulk download is disabled when a selected document denies download permission', () => {
    const h = harness();
    h.select([{ id: '1', name: 'protected.pdf', permissions: { canDownload: false } }]);
    assert.equal(h.get('DownloadDocuments').disabled, true);
});

test('selection controls stay hidden when every document is denied move and delete', () => {
    const h = harness();
    h.select([{ id: '1', name: 'protected', allowMove: false, allowDelete: false }]);
    assert.equal(h.get('SelectPage').hidden, true);
    assert.equal(h.get('SelectPage').disabled, true);
    assert.equal(h.get('DocumentActions').hidden, true);
});

test('moving selected files sends the documented body and removes successes', async () => {
    const h = harness(); h.select(); h.get('MoveDocuments').emit('click');
    assert.deepEqual(h.get('Target').children.map((option) => option.textContent), ['— เลือกโฟลเดอร์ปลายทาง —', 'คลังเอกสาร', 'source', 'target']);
    h.get('Target').value = '/root/target'; h.get('Target').emit('change');
    await h.get('Form').emit('submit');
    assert.deepEqual(h.requests, [{ path: '/user-api/alfresco/documents/bulk-move', method: 'POST', body: { documents: [{ id: '1', name: '<file>.pdf' }], targetFolderPath: '/root/target' } }]);
    assert.equal(h.get('DocumentActions').hidden, true);
    assert.equal(h.refreshes.length, 1);
    assert.equal(h.get('Confirm').hidden, true);
});

test('sequential delete requires confirmation and retains only failures', async () => {
    let call = 0;
    const h = harness(() => {
        if (++call === 1) return { deleted: true };
        throw Object.assign(new Error('<denied>'), { status: 403 });
    });
    h.select([{ id: '1', name: 'one' }, { id: '2', name: 'two' }]);
    h.get('DeleteDocuments').emit('click');
    assert.equal(h.requests.length, 0);
    assert.equal(h.get('Title').textContent, 'ยืนยันการลบไฟล์');
    assert.equal(h.get('Description').textContent, 'คุณกำลังจะลบไฟล์ 2 รายการ กรุณาตรวจสอบก่อนยืนยัน');
    assert.equal(h.get('DeleteWarning').hidden, false);
    assert.equal(h.get('DeleteProgress').hidden, true);
    assert.equal(h.get('Confirm').textContent, 'ลบไฟล์ 2 รายการ');
    assert.equal(h.document.activeElement, h.get('Cancel'));
    await h.get('Form').emit('submit');
    assert.equal(h.requests[0].path, '/user-api/alfresco/documents/1');
    assert.equal(h.requests[1].path, '/user-api/alfresco/documents/2');
    assert.equal(h.requests[0].method, 'DELETE');
    assert.equal(h.get('DeleteProgress').hidden, false);
    assert.equal(h.get('DeleteProgress').max, 2);
    assert.equal(h.get('DeleteProgress').value, 2);
    assert.equal(h.get('Cancel').textContent, 'เสร็จสิ้น');
    assert.equal(h.requests[0].body, undefined);
    assert.equal(h.get('DocumentCount').textContent, 'เลือกแล้ว 1 ไฟล์');
    assert.match(h.get('Items').children[1].children[1].children[1].textContent, /<denied>/);
    assert.match(h.get('Items').children[0].children[1].children[0].className, /upload-state-success/);
    assert.match(h.get('Items').children[0].children[1].children[0].children[0].className, /fa-circle-check/);
});

test('folder checkboxes send a folder batch separately from documents', async () => {
    const h = harness(() => ({ results: [{ id: 'f', ok: true, moved: true }] }));
    h.select(); h.get('FolderMode').emit('click');
    assert.equal(h.get('DocumentActions').hidden, true);
    const checkbox = h.get('FolderChoices').children[0].children[0];
    checkbox.checked = true; checkbox.emit('change');
    h.get('MoveFolders').emit('click');
    h.get('Target').value = '/root/target'; h.get('Target').emit('change');
    await h.get('Form').emit('submit');
    assert.deepEqual(h.requests[0].body, { folders: [{ id: 'f', name: 'source' }], targetFolderPath: '/root/target' });
    assert.equal(h.requests[0].path, '/user-api/alfresco/folders/bulk-move');
});

test('a large folder catalog creates no checkbox DOM until folder selection opens', () => {
    const h = harness();
    h.api.setFolders(Array.from({ length: 5000 }, (_, index) => ({ id: String(index), path: `/root/folder-${index}` })));
    assert.equal(h.get('FolderChoices').children.length, 0);
    h.get('FolderMode').emit('click');
    assert.equal(h.get('FolderChoices').children.length, 5000);
    h.get('FolderMode').emit('click');
    assert.equal(h.get('FolderChoices').children.length, 0);
});

test('selection persists across pages but clears when the source or search changes', () => {
    const h = harness(); h.select();
    h.api.setDocuments([{ id: '2', name: 'page two' }], '/root/source');
    assert.equal(h.get('DocumentCount').textContent, 'เลือกแล้ว 1 ไฟล์');
    h.api.setContext('/root/source', 'search');
    assert.equal(h.get('DocumentActions').hidden, true);
});

test('delete is disabled for explicitly denied permissions and a same-folder move cannot submit', async () => {
    const h = harness();
    h.select([{ id: '1', name: 'protected', permissions: { canDelete: false } }]);
    assert.equal(h.get('DeleteDocuments').disabled, true);
    h.get('MoveDocuments').emit('click');
    h.get('Target').value = '/root/source'; h.get('Target').emit('change');
    assert.equal(h.get('Confirm').disabled, true);
    await h.get('Form').emit('submit');
    assert.equal(h.requests.length, 0);
});

test('duplicate submits and cancel are blocked during a request; network failure is not retried', async () => {
    let reject;
    const h = harness(() => new Promise((resolve, fail) => { reject = fail; }));
    h.select(); h.get('DeleteDocuments').emit('click');
    const pending = h.get('Form').emit('submit');
    await h.get('Form').emit('submit'); h.get('Cancel').emit('click');
    assert.equal(h.get('Modal').hidden, false);
    assert.equal(h.requests.length, 1);
    reject(new Error('offline')); await pending;
    assert.equal(h.get('DocumentCount').textContent, 'เลือกแล้ว 1 ไฟล์');
    assert.equal(h.get('Confirm').hidden, true);
    assert.match(h.get('Items').children[0].children[1].children[1].textContent, /offline/);
});
