const test = require('node:test');
const assert = require('node:assert/strict');
const { deleteSequentially } = require('../../public/assets/js/direct-bulk.js');

test('deletes serially, encodes ids and reports each state', async () => {
    const calls = [], snapshots = [];
    const results = await deleteSequentially([{ id: 'a;1.0' }, { id: 'b' }], async (url, options) => {
        calls.push(url);
        assert.equal(options.method, 'DELETE');
        return { deleted: true };
    }, (states) => snapshots.push(states.map((item) => item.state)));
    assert.deepEqual(calls, ['/user-api/alfresco/documents/a%3B1.0', '/user-api/alfresco/documents/b']);
    assert.ok(snapshots.some((states) => states[0] === 'success' && states[1] === 'deleting'));
    assert.equal(results.filter((item) => item.ok).length, 2);
});

test('permission rejection does not prevent subsequent authorized delete', async () => {
    let count = 0;
    const results = await deleteSequentially([{ id: 'a' }, { id: 'b' }], async () => {
        if (++count === 1) throw Object.assign(new Error('Forbidden'), { status: 403 });
        return { deleted: true };
    }, () => {});
    assert.deepEqual(results.map((item) => item.state), ['failed', 'success']);
});

test('uncertain errors, expired session and throttling stop without retries', async () => {
    for (const status of [undefined, 500, 401, 429]) {
        let calls = 0;
        const results = await deleteSequentially([{ id: 'a' }, { id: 'b' }], async () => {
            calls++;
            throw Object.assign(new Error('Failed'), { status });
        }, () => {});
        assert.equal(calls, 1);
        assert.equal(results[1].state, 'pending');
        assert.equal(results[0].state, status === 401 || status === 429 ? 'failed' : 'unknown');
    }
});

test('unexpected success response is not treated as confirmed deletion', async () => {
    let calls = 0;
    const results = await deleteSequentially([{ id: 'a' }, { id: 'b' }], async () => { calls++; return {}; }, () => {});
    assert.equal(calls, 1);
    assert.deepEqual(results.map((item) => item.state), ['unknown', 'pending']);
});
