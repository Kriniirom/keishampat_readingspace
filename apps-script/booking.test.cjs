const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');

// In-memory Apps Script adapter: no requests to Google and no live customer writes.
function setup() {
  const sheets = new Map();
  let locked = false;
  class Sheet {
    constructor() { this.data = []; }
    appendRow(row) {
      if (/^KRS-/.test(String(row[0]))) assert.equal(locked, true, 'booking must be saved under the script lock');
      this.data.push([...row]);
    }
    getLastRow() { return this.data.length; }
    getLastColumn() { return Math.max(0, ...this.data.map(r => r.length)); }
    getRange(row, col, height = 1, width = 1) {
      return {
        getValues: () => Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => this.data[row - 1 + y]?.[col - 1 + x] ?? '')),
        setValue: value => {
          this.data[row - 1] ||= []; this.data[row - 1][col - 1] = value;
        },
        setValues: values => {
          assert.equal(values.length, height); assert.equal(values[0].length, width);
          values.forEach((r, y) => r.forEach((v, x) => { this.data[row - 1 + y] ||= []; this.data[row - 1 + y][col - 1 + x] = v; }));
        }
      };
    }
    getDataRange() { return this.getRange(1, 1, this.getLastRow(), this.getLastColumn()); }
  }
  const spreadsheet = { getSheetByName: name => sheets.get(name), insertSheet: name => { const s = new Sheet(); sheets.set(name, s); return s; } };
  const context = vm.createContext({
    console, Date,
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: value => ({ value, setMimeType() { return this; } }) },
    SpreadsheetApp: { openById: () => spreadsheet, flush() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: name => ({ API_SECRET: 'test-api', ADMIN_SECRET: 'test-admin' })[name] }) },
    LockService: { getScriptLock: () => ({ waitLock() { assert.equal(locked, false); locked = true; }, hasLock: () => locked, releaseLock() { locked = false; } }) },
    Utilities: { getUuid: () => crypto.randomUUID(), formatDate: date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date) }
  });
  vm.runInContext(fs.readFileSync(__dirname + '/Code.gs', 'utf8'), context);
  function call(data) {
    const result = JSON.parse(context.doPost({ postData: { contents: JSON.stringify({ apiSecret: 'test-api', ...data }) } }).value);
    assert.equal(locked, false, 'lock released on success or failure');
    return result;
  }
  const input = { action: 'createBooking', requestId: crypto.randomUUID(), name: 'Test Student', phone: '9876543210', address: 'Test locality', seatId: 1, startDate: context.today_(), shift: 'fullday', durationMonths: 1 };
  function create() { const r = call(input); assert.equal(r.success, true, r.error); return r.booking; }
  function report(booking, extra = {}) { return call({ action: 'reportPayment', bookingId: booking.bookingId, phone: input.phone, paymentMethod: 'upi', transactionRef: '123456789012', ...extra }); }
  function approve(booking, extra = {}) { return call({ action: 'approvePayment', adminSecret: 'test-admin', bookingId: booking.bookingId, ...extra }); }
  return { context, sheets, call, input, create, report, approve };
}

test('registration retry creates one row and ignores forged confirmed status/price', () => {
  const t = setup(); const first = t.call({ ...t.input, amount: '₹1', status: 'Confirm' });
  const retry = t.call(t.input);
  assert.equal(first.booking.bookingId, retry.booking.bookingId);
  assert.equal(first.booking.status, 'Pending'); assert.equal(first.booking.amount, '₹800');
  assert.equal(t.sheets.get('Bookings').data.length, 2);
});
test('another request from same phone and competing seat bookings are rejected', () => {
  const t = setup(); t.create();
  assert.equal(t.call({ ...t.input, requestId: crypto.randomUUID() }).success, false);
  assert.equal(t.call({ ...t.input, requestId: crypto.randomUUID(), phone: '9876543211' }).success, false);
  assert.equal(t.sheets.get('Bookings').data.length, 2);
});
test('UPI reports remain pending; only authenticated admin approval confirms', () => {
  const t = setup(); const b = t.create();
  assert.equal(t.approve(b).success, false);
  assert.equal(t.report(b).booking.status, 'Pending');
  assert.equal(t.report(b).booking.status, 'Pending');
  assert.equal(t.call({ action: 'approvePayment', bookingId: b.bookingId }).success, false);
  assert.equal(t.approve(b).booking.status, 'Confirm');
  assert.equal(t.approve(b).booking.status, 'Confirm');
});
test('renewal leaves expiry unchanged until approval and repeated approvals extend only once', () => {
  const t = setup(); const b = t.create(); t.report(b); t.approve(b);
  const request = { action: 'renewBooking', bookingId: b.bookingId, phone: t.input.phone, requestId: crypto.randomUUID() };
  const r = t.call(request);
  assert.equal(r.success, true, r.error); assert.equal(r.booking.expiry, b.expiry);
  assert.equal(t.call(request).renewal.requestId, r.renewal.requestId);
  assert.equal(t.call({ ...request, requestId: crypto.randomUUID() }).renewal.requestId, r.renewal.requestId);
  assert.equal(t.sheets.get('Bookings').data.length, 2); assert.equal(t.sheets.get('Renewals').data.length, 2);
  t.report(b, { renewalId: r.renewal.requestId, transactionRef: '987654321098' });
  const approved = t.approve(b, { renewalId: r.renewal.requestId });
  assert.equal(approved.booking.expiry, r.renewal.newExpiry);
  assert.equal(t.approve(b, { renewalId: r.renewal.requestId }).booking.expiry, r.renewal.newExpiry);
  assert.equal(t.call({ action: 'lookup', bookingId: b.bookingId, phone: t.input.phone }).renewal.status, 'Confirm');
});
test('public availability and GET do not expose customer records; lookup needs exact ID and phone', () => {
  const t = setup(); const b = t.create();
  const seats = t.call({ action: 'seats' });
  assert.equal(seats.bookings[0].name, undefined); assert.equal(seats.bookings[0].phone, undefined);
  assert.equal(JSON.parse(t.context.doGet().value).success, false);
  assert.equal(t.call({ action: 'lookup', bookingId: b.bookingId, phone: '0000000000' }).success, false);
  assert.equal(t.call({ action: 'lookup', bookingId: b.bookingId, phone: '+91 98765 43210' }).success, true);
});
test('unknown action and invalid requests do not append customer rows', () => {
  const t = setup();
  assert.equal(t.call({ ...t.input, action: 'surprise' }).success, false);
  assert.equal(t.call({ ...t.input, phone: '123' }).success, false);
  assert.equal(t.call({ ...t.input, startDate: '2026-02-30' }).success, false);
  assert.equal(t.sheets.get('Bookings').data.length, 1);
});
test('quarterly price and date arithmetic are server controlled', () => {
  const t = setup(); const r = t.call({ ...t.input, durationMonths: 3, amount: '₹10' });
  assert.equal(r.booking.amount, '₹2300');
  assert.equal(t.context.months_('2028-01-31', 1), '2028-02-29');
  assert.equal(t.context.months_('2027-01-31', 1), '2027-02-28');
});
test('day passes have no monthly grace period and seat parsing ignores the 1 in day-pass label', () => {
  const t = setup(); const r = t.call({ ...t.input, shift: 'daypass' });
  assert.equal(r.booking.seatId, 1); assert.equal(r.booking.expiry, t.input.startDate);
  assert.equal(r.booking.amount, '₹50');
  const row = t.sheets.get('Bookings').data[1]; row[6] = t.context.days_(t.context.today_(), -1);
  assert.equal(t.call({ action: 'seats' }).bookings.length, 0);
});
test('rejected requests release seats and cannot later be approved', () => {
  const t = setup(); const b = t.create(); t.report(b);
  assert.equal(t.call({ action: 'rejectPayment', adminSecret: 'test-admin', bookingId: b.bookingId }).booking.status, 'Expired');
  assert.equal(t.approve(b).success, false); assert.equal(t.call({ action: 'seats' }).bookings.length, 0);
});

test('a transaction reference cannot pay both admission and renewal', () => {
  const t = setup(); const b = t.create(); t.report(b); t.approve(b);
  const r = t.call({ action: 'renewBooking', bookingId: b.bookingId, phone: t.input.phone, requestId: crypto.randomUUID() });
  assert.equal(t.report(b, { renewalId: r.renewal.requestId }).success, false);
  assert.equal(t.report(b, { renewalId: r.renewal.requestId, transactionRef: '876543210987' }).success, true);
});

test('legacy Status in column N and extra formulas survive registration and renewal approval', () => {
  const t = setup();
  t.context.sheet_('Bookings', vm.runInContext('BOOKING_HEADERS', t.context));
  const physical = t.sheets.get('Bookings');
  physical.data = [physical.data[0].slice(0, 13).concat(['Status', 'Legacy notes'])];
  const b = t.create();
  assert.equal(physical.data[0][13], 'Status');
  assert.equal(physical.data[0][14], 'Legacy notes');
  assert.equal(physical.data[0][15], 'Request ID');
  physical.data[1][13] = '=J2'; physical.data[1][14] = 'Keep this note';
  assert.equal(t.call(t.input).booking.bookingId, b.bookingId);
  t.report(b); t.approve(b);
  const renewal = t.call({ action: 'renewBooking', bookingId: b.bookingId, phone: t.input.phone, requestId: crypto.randomUUID() });
  assert.equal(renewal.success, true, renewal.error);
  t.report(b, { renewalId: renewal.renewal.requestId, transactionRef: '876543210987' });
  assert.equal(t.approve(b, { renewalId: renewal.renewal.requestId }).booking.expiry, renewal.renewal.newExpiry);
  assert.equal(physical.data[1][13], '=J2'); assert.equal(physical.data[1][14], 'Keep this note');
  assert.equal(physical.data.length, 2);
});


test('pending registration holds the seat before payment and exposes only supported statuses', () => {
  const t = setup(); const b = t.create();
  assert.equal(b.status, 'Pending'); assert.equal(b.paymentSubmitted, false);
  const seats = t.call({ action: 'seats' }).bookings;
  assert.equal(seats.length, 1); assert.equal(seats[0].status, 'Pending');
  const competing = t.call({ ...t.input, requestId: crypto.randomUUID(), phone: '9876543211' });
  assert.equal(competing.success, false); assert.match(competing.error, /no longer available/);
  const reported = t.report(b);
  assert.equal(reported.booking.status, 'Pending'); assert.equal(reported.booking.paymentSubmitted, true);
  assert.equal(t.sheets.get('Bookings').data[1][9], 'Pending');
  assert.equal(t.approve(b).booking.status, 'Confirm');
  assert.equal(t.sheets.get('Bookings').data[1][9], 'Confirm');
});
test('cash submission stays Pending and can be verified without a UPI reference', () => {
  const t = setup(); const b = t.create();
  const r = t.report(b, { paymentMethod: 'cash', transactionRef: '' });
  assert.equal(r.booking.status, 'Pending'); assert.equal(r.booking.paymentSubmitted, true);
  assert.equal(t.approve(b).booking.status, 'Confirm');
});
test('legacy statuses remain readable and renewal writes only the three sheet statuses', () => {
  const t = setup(); const b = t.create();
  t.sheets.get('Bookings').data[1][9] = 'Payment verification pending';
  assert.equal(t.call({ action: 'lookup', bookingId: b.bookingId, phone: t.input.phone }).booking.paymentSubmitted, true);
  t.approve(b);
  t.sheets.get('Bookings').data[1][9] = 'Confirmed';
  const r = t.call({ action: 'renewBooking', requestId: crypto.randomUUID(), bookingId: b.bookingId, phone: t.input.phone });
  assert.equal(r.success, true, r.error); assert.equal(r.renewal.status, 'Pending');
  const paid = t.report(b, { renewalId: r.renewal.requestId, transactionRef: 'RENEW123456' });
  assert.equal(paid.renewal.status, 'Pending'); assert.equal(paid.renewal.paymentSubmitted, true);
  assert.equal(t.approve(b, { renewalId: r.renewal.requestId }).renewal.status, 'Confirm');
});


test('expired membership can renew from today, holds its seat, and extends only on approval', () => {
  const t = setup(); const b = t.create();
  const row = t.sheets.get('Bookings').data[1];
  row[9] = 'Expired'; row[6] = t.context.days_(t.context.today_(), -20);
  const oldExpiry = row[6];
  const request = { action: 'renewBooking', bookingId: b.bookingId, phone: t.input.phone, requestId: crypto.randomUUID() };
  const renewal = t.call(request);
  assert.equal(renewal.success, true, renewal.error);
  assert.equal(renewal.booking.expiry, oldExpiry);
  assert.equal(renewal.renewal.newExpiry, t.context.months_(t.context.today_(), 1));
  assert.equal(renewal.renewal.status, 'Pending');
  assert.equal(t.call(request).renewal.requestId, renewal.renewal.requestId);
  assert.equal(t.call({ action: 'seats' }).bookings[0].status, 'Pending');
  assert.equal(t.call({ ...t.input, requestId: crypto.randomUUID(), phone: '9876543211' }).success, false);
  t.report(b, { renewalId: renewal.renewal.requestId, transactionRef: 'RENEW987654' });
  const approved = t.approve(b, { renewalId: renewal.renewal.requestId });
  assert.equal(approved.booking.status, 'Confirm');
  assert.equal(approved.booking.expiry, renewal.renewal.newExpiry);
});
test('expired renewal is blocked before payment when the seat belongs to another customer', () => {
  const t = setup(); const b = t.create();
  t.sheets.get('Bookings').data[1][9] = 'Expired';
  assert.equal(t.call({ ...t.input, requestId: crypto.randomUUID(), phone: '9876543211' }).success, true);
  const r = t.call({ action: 'renewBooking', bookingId: b.bookingId, phone: t.input.phone, requestId: crypto.randomUUID() });
  assert.equal(r.success, false); assert.match(r.error, /assigned to another member/);
  assert.equal(t.sheets.get('Renewals').data.length, 1);
});


test('phone-only lookup finds membership and supports renewal without customer entering ID', () => {
  const t = setup(); const b = t.create(); t.report(b); t.approve(b);
  const found = t.call({ action: 'lookup', phone: '+91 98765 43210' });
  assert.equal(found.success, true); assert.equal(found.booking.bookingId, b.bookingId);
  const renewed = t.call({ action: 'renewBooking', bookingId: found.booking.bookingId, phone: t.input.phone, requestId: crypto.randomUUID() });
  assert.equal(renewed.success, true, renewed.error);
  assert.equal(t.call({ action: 'lookup', phone: '123' }).success, false);
  assert.equal(t.call({ action: 'lookup', phone: '9876543211' }).success, false);
  assert.equal(t.call({ action: 'renewBooking', phone: t.input.phone, requestId: crypto.randomUUID() }).success, false);
});
test('phone lookup finds expired membership and prefers a current membership over expired history', () => {
  const t = setup(); const b = t.create();
  const sheet = t.sheets.get('Bookings');
  sheet.data[1][9] = 'Expired';
  assert.equal(t.call({ action: 'lookup', phone: t.input.phone }).booking.bookingId, b.bookingId);
  const next = t.call({ ...t.input, requestId: crypto.randomUUID(), seatId: 2 });
  assert.equal(next.success, true);
  assert.equal(t.call({ action: 'lookup', phone: t.input.phone }).booking.bookingId, next.booking.bookingId);
  sheet.data[1][9] = 'Confirm';
  const ambiguous = t.call({ action: 'lookup', phone: t.input.phone });
  assert.equal(ambiguous.success, false); assert.match(ambiguous.error, /More than one current membership/);
});
