const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../../public/assets/js/direct-documents.js'), 'utf8');

for (const name of ['fileInfoModal', 'renameFileModal', 'updateFileModal', 'deleteFileModal', 'createFolderModal']) {
    test(name + ' backdrop preserves modal while explicit close remains wired', () => {
        const start = source.indexOf(name + ".addEventListener('click', (event) => {");
        assert.ok(start >= 0);
        const end = source.indexOf('\n    });', start);
        const alternate = source.indexOf('\n        });', start);
        const stop = alternate >= 0 && alternate < end ? alternate : end;
        const snippet = source.slice(start, stop) + '\n});';
        let callback;
        const modal = { hidden: false, addEventListener(type, fn) { callback = fn; } };
        vm.runInNewContext(snippet, { [name]: modal });
        let prevented = false;
        callback({ target: modal, preventDefault() { prevented = true; } });
        assert.equal(prevented, true);
        assert.equal(modal.hidden, false);
    });
}
