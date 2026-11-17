const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');

function load(fetch, env = { APPS_SCRIPT_URL: 'https://example.test/exec', APPS_SCRIPT_SECRET: 'server-secret' }) {
  const exports = {};
  const context = vm.createContext({
    exports, process: { env }, AbortSignal, fetch,
    require: name => {
      assert.equal(name, 'next/server');
      return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } };
    }
  });
  vm.runInContext(ts.transpileModule(fs.readFileSync(__dirname + '/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return body => exports.POST({ json: async () => body });
}
test('missing configuration blocks booking without calling the remote script', async () => {
  const post = load(() => { throw new Error('must not run'); }, {});
  assert.equal((await post({ action: 'createBooking' })).status, 503);
});
test('browser cannot forward an admin action through the website', async () => {
  const post = load(() => { throw new Error('must not run'); });
  assert.equal((await post({ action: 'approvePayment' })).status, 400);
});
test('server supplies its own secret and requires a verified protocol response', async () => {
  const post = load(async (url, request) => {
    assert.equal(JSON.parse(request.body).apiSecret, 'server-secret');
    assert.equal(request.mode, undefined);
    return { ok: true, json: async () => ({ protocol: 2, success: true, booking: { bookingId: 'KRS-TEST' } }) };
  });
  const result = await post({ action: 'createBooking', apiSecret: 'forged' });
  assert.equal(result.status, 200); assert.equal(result.body.booking.bookingId, 'KRS-TEST');
});
test('legacy script success is not accepted as reliable confirmation', async () => {
  const post = load(async () => ({ ok: true, json: async () => ({ success: true }) }));
  const result = await post({ action: 'createBooking' });
  assert.equal(result.status, 502); assert.equal(result.body.success, false);
});
test('backend rejection and timeout are never converted to success', async () => {
  const rejected = load(async () => ({ ok: true, json: async () => ({ protocol: 2, success: false, error: 'Seat taken' }) }));
  assert.equal((await rejected({ action: 'createBooking' })).body.error, 'Seat taken');
  const timeout = load(async () => { throw new Error('timeout'); });
  const result = await timeout({ action: 'renewBooking' });
  assert.equal(result.status, 502); assert.match(result.body.error, /Do not pay again/);
});
