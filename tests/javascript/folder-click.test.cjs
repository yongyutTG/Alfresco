const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../../public/assets/js/direct-documents.js'), 'utf8');
const from = source.indexOf("button.addEventListener('click', async (event) => {", source.indexOf('function createFolderButton'));
const to = source.indexOf('\n        return button;', from);
const snippet = source.slice(from, to);
function harness(item, initialPath = '/old') {
    let click;
    const calls = [];
    const state = { folderPath: initialPath, isHomeSelected: false, page: 3 };
    const keywordInput = { value: 'existing search' };
    const context = {
        item, state, keywordInput, folderName: item.name,
        button: { dataset: { treeLoaded: 'false' }, addEventListener(type, fn) { click = fn; } },
        loadFullFolderTree: async () => calls.push('tree'),
        toggleFolderChildren: () => calls.push('toggle'),
        notifyError: () => calls.push('error'),
        setSelectedFolder(path) { state.folderPath = path; calls.push('select'); },
        setResultCount() {}, selectHomeFolder() {}, updatePager() {},
        showLoadingSpinner() {}, loadDocuments: async () => calls.push('documents'),
        setMessage() {}, setFolderResultBadge() {}, rows: {},
    };
    vm.runInNewContext(snippet, context);
    return { calls, state, keywordInput, click: (arrow) => click({ target: { closest: () => arrow } }), context };
}
test('arrow preserves selection, search and table without requesting documents', async () => {
    const h = harness({ path: '/folder', name: 'folder' });
    await h.click(true);
    assert.deepEqual(h.calls, ['toggle']);
    assert.equal(h.state.folderPath, '/old');
    assert.equal(h.state.page, 3);
    assert.equal(h.keywordInput.value, 'existing search');
});
test('root first arrow loads tree without immediately collapsing it', async () => {
    const h = harness({ path: '/root', name: 'root', isTreeRoot: true });
    await h.click(true);
    assert.deepEqual(h.calls, ['tree']);
    h.context.button.dataset.treeLoaded = 'true';
    await h.click(true);
    assert.deepEqual(h.calls, ['tree', 'toggle']);
});
test('name selects and loads once; repeat click preserves document results', async () => {
    const h = harness({ path: '/folder', name: 'folder' });
    await h.click(false);
    assert.deepEqual(h.calls, ['select', 'documents']);
    assert.equal(h.keywordInput.value, '');
    await h.click(false);
    assert.deepEqual(h.calls, ['select', 'documents']);
});
test('same folder exits an empty search result and restores page one listing', async () => {
    const h = harness({ path: '/folder', name: 'folder' }, '/folder');
    h.state.documentSearchActive = true;
    h.state.currentDocuments = [];
    await h.click(false);
    assert.deepEqual(h.calls, ['select', 'documents']);
    assert.equal(h.keywordInput.value, '');
    assert.equal(h.state.page, 1);
    assert.equal(h.state.documentSearchActive, false);
    await h.click(false);
    assert.deepEqual(h.calls, ['select', 'documents']);
});
test('same folder restores listing even after search input was cleared manually', async () => {
    const h = harness({ path: '/folder', name: 'folder' }, '/folder');
    h.state.documentSearchActive = true;
    h.keywordInput.value = '';
    await h.click(false);
    assert.deepEqual(h.calls, ['select', 'documents']);
});
test('arrow does not exit current search results', async () => {
    const h = harness({ path: '/folder', name: 'folder' }, '/folder');
    h.state.documentSearchActive = true;
    await h.click(true);
    assert.deepEqual(h.calls, ['toggle']);
    assert.equal(h.state.documentSearchActive, true);
    assert.equal(h.keywordInput.value, 'existing search');
});
