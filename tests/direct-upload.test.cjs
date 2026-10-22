const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function setup(request) {
    function element() {
        return {
            hidden: false, files: [], events: {}, children: [], classList: { add() {}, remove() {}, toggle() {} },
            addEventListener(name, fn) { this.events[name] = fn; },
            setAttribute() {}, replaceChildren() { this.children = []; },
            append(...children) { this.children.push(...children); },
            focus() {}, click() {},
        };
    }
    const elements = new Map();
    const get = (id) => {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
    };
    class Form {
        constructor() { this.values = []; }
        append(key, value) { this.values.push([key, value]); }
    }
    const window = { addEventListener() {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/assets/js/direct-upload.js'), 'utf8'), {
        window, document: { getElementById: get, createElement: element }, FormData: Form,
    });
    const refreshedPaths = [];
    const refreshedDocuments = [];
    const ui = window.createDocumentUploader({ request, refresh: async (folderPath, documents) => { refreshedPaths.push(folderPath); refreshedDocuments.push(documents); } });
    ui.setFolder('/finance', true);
    get('uploadFilePlaceholderBtn').events.click();
    function select(count) {
        get('uploadFiles').files = Array.from({ length: count }, (_, i) => ({ name: i + '.pdf', size: 1 }));
        get('uploadFiles').events.change();
    }
    return { get, select, ui, refreshedPaths, refreshedDocuments };
}
test('100 files upload sequentially; retry excludes successes and modal stays open', async () => {
    const sizes = [];
    let running = 0;
    let maximum = 0;
    const { get, select, ui, refreshedPaths, refreshedDocuments } = setup(async (form) => {
        maximum = Math.max(maximum, ++running);
        const files = form.values.filter(([key]) => key === 'file');
        sizes.push(files.length);
        await Promise.resolve();
        running--;
        const file = files[0][1];
        if (sizes.length === 1) throw Object.assign(new Error('Duplicate filename'), { status: 409 });
        return { ok: true, document: { id: file.name, name: file.name } };
    });
    select(101);
    assert.equal(get('uploadTarget').textContent, 'finance');
    assert.equal(get('uploadStart').disabled, true);
    select(100);
    await get('uploadStart').events.click();
    assert.deepEqual(sizes, Array(100).fill(1));
    assert.equal(maximum, 1);
    assert.deepEqual(refreshedPaths, ['/finance']);
    assert.equal(refreshedDocuments[0].length, 99);
    assert.equal(get('uploadRetry').hidden, false);
    assert.equal(get('uploadDialog').hidden, false);
    await get('uploadRetry').events.click();
    assert.deepEqual(sizes, Array(101).fill(1));
    assert.equal(get('uploadRetry').hidden, true);
    assert.equal(get('uploadDialog').hidden, false);
    assert.equal(get('uploadClose').textContent, 'เสร็จสิ้น');
    get('uploadClose').events.click();
    assert.equal(get('uploadDialog').hidden, true);
    assert.equal(refreshedDocuments[1].length, 100);
    ui.setFolder('/denied', false);
    assert.equal(get('uploadFilePlaceholderBtn').hidden, true);
});
test('unknown network result is not retried; remaining files stay pending', async () => {
    let calls = 0;
    const { get, select } = setup(async () => { calls++; throw new Error('Network error'); });
    select(21);
    await get('uploadStart').events.click();
    assert.equal(calls, 1);
    assert.equal(get('uploadRetry').hidden, true);
    assert.equal(get('uploadStart').disabled, false);
    assert.match(get('uploadResults').children[0].children[2].children[0].textContent, /ไม่ทราบผล/);
});
test('each response updates its icon before the next file starts', async () => {
    const releases = [];
    const { get, select } = setup(() => new Promise((resolve) => releases.push(resolve)));
    select(2);
    const running = get('uploadStart').events.click();
    const badge = (index) => get('uploadResults').children[index].children[2].children[0];
    assert.match(badge(0).className, /sending/);
    assert.match(badge(0).children[0].className, /fa-spin/);
    assert.match(badge(1).className, /pending/);
    releases[0]({ ok: true, document: { id: 'first' } });
    await new Promise((resolve) => setImmediate(resolve));
    assert.match(badge(0).className, /success/);
    assert.match(badge(0).children[0].className, /fa-circle-check/);
    assert.match(badge(1).className, /sending/);
    assert.equal(get('uploadProgress').value, 1);
    releases[1]({ ok: true, document: { id: 'second' } });
    await running;
    assert.equal(get('uploadProgress').value, 2);
    assert.equal(get('uploadDialog').hidden, false);
});
test('append, duplicate, validation, remove and drag/drop preserve selections', () => {
    const { get, select } = setup(async () => {});
    select(2);
    get('uploadFiles').files = [{ name: 'extra.pdf', size: 10 }, { name: '0.pdf', size: 1 }, { name: 'empty.pdf', size: 0 }];
    get('uploadFiles').events.change();
    assert.equal(get('uploadResults').children.length, 4);
    assert.match(get('uploadNotice').textContent, /ชื่อซ้ำ/);
    assert.match(get('uploadResults').children[3].children[2].children[0].textContent, /ไม่ถูกต้อง/);
    get('uploadResults').children[3].children[3].children[0].events.click();
    assert.equal(get('uploadResults').children.length, 3);
    get('uploadDropZone').events.drop({ preventDefault() {}, dataTransfer: { files: [{ name: 'drop.pdf', size: 12 }] } });
    assert.equal(get('uploadResults').children.length, 4);
});
test('backdrop and Escape preserve modal and selected files; close is explicit', () => {
    const { get, select } = setup(async () => {});
    select(2);
    const modal = get('uploadDialog');
    modal.events.click({ target: modal, preventDefault() {} });
    modal.events.keydown({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
    assert.equal(modal.hidden, false);
    assert.equal(get('uploadResults').children.length, 2);
    get('uploadClose').events.click();
    assert.equal(modal.hidden, true);
});
test('stop waits for current response; resume sends only remaining files', async () => {
    const calls = [], releases = [];
    const { get, select, refreshedDocuments } = setup((form) => {
        calls.push(form.values.find(([key]) => key === 'file')[1].name);
        return new Promise((resolve) => releases.push(resolve));
    });
    select(3);
    const firstRun = get('uploadStart').events.click();
    assert.equal(get('uploadStop').hidden, false);
    get('uploadStop').events.click();
    assert.equal(get('uploadStop').disabled, true);
    assert.equal(get('uploadClose').disabled, true);
    assert.deepEqual(calls, ['0.pdf']);
    releases[0]({ ok: true, document: { id: '0' } });
    await firstRun;
    assert.deepEqual(calls, ['0.pdf']);
    assert.equal(get('uploadStart').textContent, 'ทำต่ออีก 2 ไฟล์');
    assert.equal(get('uploadStop').hidden, true);
    assert.equal(get('uploadDialog').hidden, false);
    assert.equal(refreshedDocuments[0].length, 1);
    const resumed = get('uploadStart').events.click();
    assert.deepEqual(calls, ['0.pdf', '1.pdf']);
    releases[1]({ ok: true, document: { id: '1' } });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(calls, ['0.pdf', '1.pdf', '2.pdf']);
    releases[2]({ ok: true, document: { id: '2' } });
    await resumed;
    assert.equal(get('uploadClose').textContent, 'เสร็จสิ้น');
    assert.equal(refreshedDocuments[1].length, 3);
});
test('stop on final file completes normally without offering empty resume', async () => {
    let finish;
    const { get, select } = setup(() => new Promise((resolve) => { finish = resolve; }));
    select(1);
    const running = get('uploadStart').events.click();
    get('uploadStop').events.click();
    finish({ ok: true, document: { id: 'only' } });
    await running;
    assert.equal(get('uploadStart').disabled, true);
    assert.equal(get('uploadClose').textContent, 'เสร็จสิ้น');
    assert.equal(get('uploadDialog').hidden, false);
});
