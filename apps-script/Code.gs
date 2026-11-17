// Replace the existing Apps Script with this file. See SETUP.md before deploying.
const SPREADSHEET_ID = '1wgHU6riA9vITmltloFM3dOwih0gKA1GXawVEzDGK5pA';
const BOOKING_HEADERS = ['Booking ID', 'Name', 'Phone', 'Address', 'Seat', 'Start Date', 'Expiry', 'Amount', 'Payment Method', 'Status', 'Subject', 'Message', 'Email', 'Request ID', 'Shift', 'Transaction Ref', 'Created At', 'Verified At'];
const RENEWAL_HEADERS = ['Request ID', 'Booking ID', 'Base Expiry', 'Proposed Expiry', 'Amount', 'Payment Method', 'Transaction Ref', 'Status', 'Created At', 'Verified At'];
const PENDING = 'Pending';
// Payment submission is tracked by method/reference, not a fourth sheet status.
function status_(value) {
  const s = String(value).trim();
  if (/^(confirm|confirmed|active|paid)$/i.test(s)) return 'Confirm';
  if (/cancel|reject|expired|available|vacant|free/i.test(s)) return 'Expired';
  return 'Pending';
}
function submitted_(status, method, ref) {
  return /verification/i.test(String(status)) || /cash/i.test(String(method)) || (!!method && !!ref);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(Object.assign({ protocol: 2 }, value))).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  // Public endpoint never returns customer records.
  return json_({ success: false, error: 'Use the website to check availability or your booking.' });
}
function sheet_(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (name === 'Bookings') return bookingColumns_(sheet, headers);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  else {
    const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
    headers.forEach(function(h, i) {
      if (existing[i] && existing[i] !== h) throw new Error('Unexpected column in ' + name + ': ' + (i + 1) + '. Ask reception to check setup.');
      if (!existing[i]) sheet.getRange(1, i + 1).setValue(h);
    });
  }
  return sheet;
}
// Present a consistent field order to booking code while preserving extra legacy columns.
function bookingColumns_(sheet, headers) {
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  const existing = sheet.getRange(1, 1, 1, Math.max(13, sheet.getLastColumn())).getValues()[0];
  const mapping = [];
  headers.forEach(function(h, i) {
    let column;
    if (i < 13) {
      if (existing[i] && existing[i] !== h) throw new Error('Unexpected column in Bookings: ' + (i + 1) + '. Expected ' + h + '.');
      column = i;
      if (!existing[i]) { sheet.getRange(1, i + 1).setValue(h); existing[i] = h; }
    } else {
      const matches = existing.map(function(value, index) { return value === h && index >= 13 ? index : -1; }).filter(function(index) { return index >= 0; });
      if (matches.length > 1) throw new Error('Duplicate booking metadata heading: ' + h + '. Contact reception.');
      column = matches.length ? matches[0] : existing.length;
      if (!matches.length) { sheet.getRange(1, column + 1).setValue(h); existing.push(h); }
    }
    mapping.push(column);
  });
  function write(rowNumber, logicalStart, values) {
    // Write only known fields, grouped into contiguous ranges. Extra cells and formulas stay untouched.
    let start = 0;
    while (start < values.length) {
      let end = start + 1;
      while (end < values.length && mapping[logicalStart + end] === mapping[logicalStart + end - 1] + 1) end++;
      sheet.getRange(rowNumber, mapping[logicalStart + start] + 1, 1, end - start).setValues([values.slice(start, end)]);
      start = end;
    }
  }
  return {
    getDataRange: function() {
      return { getValues: function() { return sheet.getDataRange().getValues().map(function(row) { return mapping.map(function(column) { return row[column] == null ? '' : row[column]; }); }); } };
    },
    appendRow: function(row) {
      const physical = Array(existing.length).fill('');
      row.forEach(function(value, i) { physical[mapping[i]] = value; });
      sheet.appendRow(physical);
    },
    getRange: function(row, column, height, width) {
      return { setValues: function(values) {
        if (values.length !== height || values.some(function(r) { return r.length !== width; })) throw new Error('Invalid booking write dimensions.');
        values.forEach(function(r, i) { write(row + i, column - 1, r); });
      } };
    }
  };
}
function rows_(sheet) { return sheet.getDataRange().getValues().slice(1); }
function text_(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 200); }
function safe_(v) { const s = text_(v, 2000); return /^[=+@\-]/.test(s) ? "'" + s : s; }
function phone_(v) { return String(v || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); }
function today_() { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'); }
function date_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd');
  const s = text_(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s) return s;
  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  return m ? date_(m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0')) : '';
}
function days_(d, n) { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
function months_(d, n) {
  const x = new Date(d + 'T00:00:00Z'); const day = x.getUTCDate();
  x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n);
  const last = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate();
  x.setUTCDate(Math.min(day, last)); return x.toISOString().slice(0, 10);
}
function seat_(row) { const m = String(row[4]).match(/(?:Seat\s*#?\s*)?(\d+)/i); return m ? Number(m[1]) : 0; }
function shift_(row) {
  const s = String(row[14] || row[4]).toLowerCase();
  return /daypass|1-day/.test(s) ? 'daypass' : /morn/.test(s) ? 'morning' : /eve/.test(s) ? 'evening' : 'fullday';
}
function pending_(s) { return /pending|awaiting/i.test(String(s)); }
function active_(r) {
  if (/cancel|reject|expired|available|vacant|free/i.test(String(r[9]))) return false;
  const expiry = date_(r[6]);
  if (!expiry) return true; // Unknown legacy dates must not silently release a seat.
  return days_(expiry, shift_(r) === 'daypass' ? 0 : 7) >= today_();
}
function latest_(rows) {
  const seen = {};
  return rows.map(function(r, i) { return { row: r, index: i + 2 }; }).reverse().filter(function(x) {
    const id = String(x.row[0]);
    if (!/^KRS-/i.test(id) || seen[id]) return false;
    seen[id] = true; return true;
  });
}
function booking_(r) {
  return { bookingId: String(r[0]), name: String(r[1]), phone: String(r[2]), address: String(r[3]), seat: String(r[4]), seatId: seat_(r), startDate: date_(r[5]), expiry: date_(r[6]), amount: String(r[7]), paymentMethod: String(r[8]), status: status_(r[9]), paymentSubmitted: submitted_(r[9], r[8], r[15]), shift: shift_(r), transactionRef: String(r[15] || '') };
}
function renewal_(r) { return { requestId: String(r[0]), bookingId: String(r[1]), newExpiry: date_(r[3]), amount: String(r[4]), paymentMethod: String(r[5]), transactionRef: String(r[6]), status: status_(r[7]), paymentSubmitted: submitted_(r[7], r[5], r[6]) }; }
function notifyOwner_(subject, reference) {
  // Notification failure must never turn a saved booking into a failed booking.
  try { MailApp.sendEmail('krinivash@gmail.com', subject, 'Request saved for Keishampat Reading Space. Reference: ' + reference + '\nReview the Bookings / Renewals sheet and verify payment before approval.'); } catch (ignored) {}
}
function requestId_(d) {
  const id = text_(d.requestId, 100);
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(id)) throw new Error('Invalid request reference. Reload the page and try again.');
  return id;
}
function findBooking_(records, d) {
  const phone = phone_(d.phone);
  if (!/^\d{10}$/.test(phone)) throw new Error('Enter your registered 10-digit phone number.');
  const matches = records.filter(function(x) { return phone_(x.row[2]) === phone; });
  if (d.action === 'lookup' && !text_(d.bookingId)) {
    // Prefer a current membership; records are already ordered newest first.
    const current = matches.filter(function(x) { return active_(x.row); });
    if (current.length > 1) throw new Error('More than one current membership uses this phone number. Please contact reception.');
    const match = current[0] || matches[0];
    if (!match) throw new Error('No booking found for this phone number. Check the number or contact reception.');
    return match;
  }
  const match = matches.find(function(x) { return String(x.row[0]).toUpperCase() === text_(d.bookingId).toUpperCase(); });
  if (!match) throw new Error('Booking not found. Check your registered phone number or contact reception.');
  return match;
}
function available_(records, seatId, start, expiry, shift, excludeId) {
  return !records.some(function(x) {
    const r = x.row;
    if (String(r[0]) === excludeId || seat_(r) !== seatId || !active_(r)) return false;
    const otherShift = shift_(r);
    if ((shift === 'morning' && otherShift === 'evening') || (shift === 'evening' && otherShift === 'morning')) return false;
    const end = date_(r[6]); const begin = date_(r[5]);
    return !end || !begin || (begin <= expiry && days_(end, otherShift === 'daypass' ? 0 : 7) >= start);
  });
}
function doPost(e) {
  let lock;
  try {
    const d = JSON.parse(e.postData.contents);
    // Keep the old public visitor logger working without exposing booking operations.
    if (d.action === 'logVisit') {
      const s = sheet_('Visitors', ['Date & Time', 'Page Visited', 'Device', 'Approximate City', 'Came From']);
      s.appendRow([new Date().toISOString(), safe_(d.page), safe_(d.device), safe_(d.city), safe_(d.cameFrom)]);
      return json_({ success: true });
    }
    const props = PropertiesService.getScriptProperties();
    const admin = ['approvePayment', 'rejectPayment'].indexOf(d.action) >= 0;
    const expected = props.getProperty(admin ? 'ADMIN_SECRET' : 'API_SECRET');
    if (!expected || (admin ? d.adminSecret : d.apiSecret) !== expected) throw new Error('Unauthorized request.');
    lock = LockService.getScriptLock(); lock.waitLock(20000);
    const sheet = sheet_('Bookings', BOOKING_HEADERS);
    const raw = rows_(sheet); const records = latest_(raw);
    const renewSheet = sheet_('Renewals', RENEWAL_HEADERS); const renewals = rows_(renewSheet);
    // A pending renewal reserves its proposed period without changing membership expiry.
    const seatRecords = records.map(function(x) {
      const renewal = renewals.find(function(r) { return String(r[1]) === String(x.row[0]) && pending_(r[7]); });
      if (!renewal) return x;
      const held = x.row.slice();
      held[5] = date_(held[5]) && date_(held[5]) < today_() ? held[5] : today_();
      held[6] = date_(renewal[3]); held[9] = PENDING;
      return { row: held, index: x.index };
    });
    if (d.action === 'seats') {
      return json_({ success: true, bookings: seatRecords.filter(function(x) { return active_(x.row); }).map(function(x) {
        const b = booking_(x.row);
        return { seatId: b.seatId, seat: b.seat, shift: b.shift, startDate: b.startDate, expiry: b.expiry, status: b.status };
      }) });
    }
    if (d.action === 'createBooking') {
      const id = requestId_(d); const phone = phone_(d.phone);
      if (!/^\d{10}$/.test(phone) || !text_(d.name) || !text_(d.address)) throw new Error('Enter your name, address and a valid 10-digit phone number.');
      const retry = raw.find(function(r) { return String(r[13]) === id; });
      if (retry) {
        if (phone_(retry[2]) !== phone) throw new Error('Request belongs to a different registration.');
        return json_({ success: true, booking: booking_(retry) });
      }
      const existing = seatRecords.find(function(x) { return phone_(x.row[2]) === phone && active_(x.row); });
      if (existing) throw new Error('An existing registration is already recorded for this phone. Use Check status / Renew with your registered phone number. Do not pay again.');
      const start = date_(d.startDate); const shift = d.shift;
      const duration = Number(d.durationMonths || 1); const seatId = Number(d.seatId);
      if (!start || start < today_() || start > days_(today_(), 30)) throw new Error('Choose a start date within the next 30 days.');
      if (['fullday', 'daypass'].indexOf(shift) < 0 || [1, 3].indexOf(duration) < 0 || !Number.isInteger(seatId) || seatId < 1 || seatId > 18) throw new Error('Invalid seat or plan.');
      const expiry = shift === 'daypass' ? start : months_(start, duration);
      if (!available_(seatRecords, seatId, start, expiry, shift, '')) throw new Error('This seat is no longer available. Refresh availability and choose another seat.');
      const amount = shift === 'daypass' ? 50 : duration === 3 ? 2300 : 800;
      const bid = 'KRS-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase();
      const row = [bid, safe_(d.name), phone, safe_(d.address), 'Seat #' + String(seatId).padStart(2, '0') + '(' + (shift === 'daypass' ? '1-day pass' : 'full day') + ')', start, expiry, '₹' + amount, '', PENDING, '', '', '', id, shift, '', new Date().toISOString(), ''];
      sheet.appendRow(row); SpreadsheetApp.flush();
      notifyOwner_('New registration awaiting payment', bid);
      return json_({ success: true, booking: booking_(row) });
    }
    if (d.action === 'contactInquiry') {
      if (!text_(d.name) || !phone_(d.phone) || !text_(d.message)) throw new Error('Enter your name, phone and message.');
      sheet_('Inquiries', ['Date', 'Name', 'Phone', 'Email', 'Subject', 'Message']).appendRow([new Date().toISOString(), safe_(d.name), phone_(d.phone), safe_(d.email), safe_(d.subject), safe_(d.message)]);
      notifyOwner_('New reading space inquiry', 'See Inquiries sheet');
      return json_({ success: true, message: 'Your inquiry has been saved. We will get back to you shortly.' });
    }
    // Admin calls are server-side Appsmith queries only; never put ADMIN_SECRET in website code.
    const found = admin ? records.find(function(x) { return String(x.row[0]) === text_(d.bookingId); }) : findBooking_(records, d);
    if (!found) throw new Error('Booking not found.');
    const row = found.row;
    const pendingRenewal = renewals.find(function(r) { return String(r[1]) === String(row[0]) && pending_(r[7]); });
    if (d.action === 'lookup') {
      const latestRenewal = pendingRenewal || renewals.slice().reverse().find(function(r) { return String(r[1]) === String(row[0]); });
      return json_({ success: true, booking: booking_(row), renewal: latestRenewal ? renewal_(latestRenewal) : null });
    }
    if (d.action === 'renewBooking') {
      const id = requestId_(d);
      const previous = renewals.find(function(r) { return String(r[0]) === id && String(r[1]) === String(row[0]); });
      if (previous || pendingRenewal) return json_({ success: true, booking: booking_(row), renewal: renewal_(previous || pendingRenewal) });
      if (!/^(confirm|confirmed|active|paid|expired)$/i.test(String(row[9]))) throw new Error('Reception must confirm your current registration before renewal.');
      if (shift_(row) === 'daypass') throw new Error('Day passes cannot be renewed monthly. Please contact reception.');
      const expiry = date_(row[6]);
      if (!expiry) throw new Error('Reception must correct your current expiry before renewal.');
      const base = /^expired$/i.test(String(row[9])) ? today_() : days_(expiry, 7) >= today_() ? expiry : today_();
      const proposed = months_(base, 1);
      if (!available_(seatRecords, seat_(row), base, proposed, shift_(row), String(row[0]))) throw new Error('Your former seat is assigned to another member. Please contact reception.');
      const r = [id, String(row[0]), expiry, proposed, /morning|evening/.test(shift_(row)) ? '₹500' : '₹800', '', '', PENDING, new Date().toISOString(), ''];
      renewSheet.appendRow(r); SpreadsheetApp.flush();
      notifyOwner_('New renewal request', String(row[0]) + ' / ' + id);
      return json_({ success: true, booking: booking_(row), renewal: renewal_(r) });
    }
    const renewalIndex = d.renewalId ? renewals.findIndex(function(r) { return String(r[0]) === String(d.renewalId) && String(r[1]) === String(row[0]); }) : -1;
    if (d.renewalId && renewalIndex < 0) throw new Error('Renewal not found.');
    const target = renewalIndex >= 0 ? renewals[renewalIndex] : row;
    const statusCol = renewalIndex >= 0 ? 7 : 9;
    if (d.action === 'reportPayment') {
      if (status_(target[statusCol]) === 'Confirm') return json_({ success: true, booking: booking_(row), renewal: renewalIndex >= 0 ? renewal_(target) : null });
      if (!pending_(target[statusCol])) throw new Error('This request is closed. Contact reception.');
      if (['upi', 'cash'].indexOf(d.paymentMethod) < 0) throw new Error('Choose UPI or cash.');
      const ref = text_(d.transactionRef, 80);
      if (d.paymentMethod === 'upi' && !/^[a-zA-Z0-9-]{6,80}$/.test(ref)) throw new Error('Enter the UPI transaction reference from your payment app.');
      if (d.paymentMethod === 'upi') {
        const usedBooking = raw.some(function(r) { return String(r[15] || '').toUpperCase() === ref.toUpperCase() && (renewalIndex >= 0 || String(r[0]) !== String(row[0])); });
        const usedRenewal = renewals.some(function(r, i) { return String(r[6] || '').toUpperCase() === ref.toUpperCase() && i !== renewalIndex; });
        if (usedBooking || usedRenewal) throw new Error('This payment reference is already linked to another request. Contact reception; do not pay again.');
      }
      target[renewalIndex >= 0 ? 5 : 8] = d.paymentMethod === 'upi' ? 'UPI' : 'Cash at Counter';
      target[renewalIndex >= 0 ? 6 : 15] = safe_(ref);
      target[statusCol] = PENDING;
    } else if (admin) {
      if (status_(target[statusCol]) === 'Confirm') return json_({ success: true, booking: booking_(row), renewal: renewalIndex >= 0 ? renewal_(target) : null });
      if (!pending_(target[statusCol])) throw new Error('This request is already closed.');
      if (d.action === 'approvePayment') {
        if (!submitted_(target[statusCol], target[renewalIndex >= 0 ? 5 : 8], target[renewalIndex >= 0 ? 6 : 15])) throw new Error('Record payment details before approving.');
        if (renewalIndex >= 0) {
          const proposed = date_(target[3]); const current = date_(row[6]);
          if (current !== date_(target[2]) && current !== proposed) throw new Error('Membership expiry changed. Review this renewal manually.');
          if (!available_(seatRecords, seat_(row), today_(), proposed, shift_(row), String(row[0]))) throw new Error('Seat conflict. Review before approving.');
          // Fixed target expiry makes recovery safe if execution stops before marking renewal approved.
          row[6] = proposed; row[9] = 'Confirm';
          sheet.getRange(found.index, 1, 1, BOOKING_HEADERS.length).setValues([row.slice(0, BOOKING_HEADERS.length)]);
        } else if (!available_(seatRecords, seat_(row), date_(row[5]), date_(row[6]), shift_(row), String(row[0]))) throw new Error('Seat conflict. Review before approving.');
        target[statusCol] = 'Confirm'; target[renewalIndex >= 0 ? 9 : 17] = new Date().toISOString();
      } else target[statusCol] = 'Expired';
    } else throw new Error('Unsupported request.');
    (renewalIndex >= 0 ? renewSheet : sheet).getRange(renewalIndex >= 0 ? renewalIndex + 2 : found.index, 1, 1, renewalIndex >= 0 ? RENEWAL_HEADERS.length : BOOKING_HEADERS.length).setValues([target.slice(0, renewalIndex >= 0 ? RENEWAL_HEADERS.length : BOOKING_HEADERS.length)]);
    SpreadsheetApp.flush();
    if (d.action === 'reportPayment') notifyOwner_('Payment verification requested', String(row[0]) + (d.renewalId ? ' / ' + d.renewalId : ''));
    return json_({ success: true, booking: booking_(row), renewal: renewalIndex >= 0 ? renewal_(target) : null });
  } catch (err) { return json_({ success: false, error: err.message || String(err) }); }
  finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}

// Optional administration directly inside the spreadsheet, without a dashboard secret in a browser.
// Run installAdminMenu once from the spreadsheet-bound Apps Script editor and reload the sheet.
function installAdminMenu() {
  sheet_('Bookings', BOOKING_HEADERS);
  sheet_('Renewals', RENEWAL_HEADERS);
  const exists = ScriptApp.getProjectTriggers().some(function(t) { return t.getHandlerFunction() === 'bookingAdminMenu'; });
  if (!exists) ScriptApp.newTrigger('bookingAdminMenu').forSpreadsheet(SPREADSHEET_ID).onOpen().create();
}
function bookingAdminMenu() {
  SpreadsheetApp.getUi().createMenu('Booking payments').addItem('Approve verified payment', 'approveFromSheet').addItem('Reject request', 'rejectFromSheet').addToUi();
}
function approveFromSheet() { adminFromSheet_('approvePayment'); }
function rejectFromSheet() { adminFromSheet_('rejectPayment'); }
function adminFromSheet_(action) {
  const ui = SpreadsheetApp.getUi();
  const booking = ui.prompt('Booking ID', 'Enter the full booking ID. Only approve money you have verified in your bank/UPI account.', ui.ButtonSet.OK_CANCEL);
  if (booking.getSelectedButton() !== ui.Button.OK) return;
  const renewal = ui.prompt('Renewal request ID', 'For a renewal, paste its Request ID from Renewals. Leave blank for a new registration.', ui.ButtonSet.OK_CANCEL);
  if (renewal.getSelectedButton() !== ui.Button.OK) return;
  const answer = ui.alert('Confirm action', action === 'approvePayment' ? 'Have you verified the amount and transaction reference against money actually received?' : 'Reject this request? The customer will see Expired.', ui.ButtonSet.YES_NO);
  if (answer !== ui.Button.YES) return;
  const response = doPost({ postData: { contents: JSON.stringify({ action: action, bookingId: booking.getResponseText().trim(), renewalId: renewal.getResponseText().trim(), adminSecret: PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET') }) } });
  const result = JSON.parse(response.getContent());
  ui.alert(result.success ? 'Saved. Status: ' + (result.renewal || result.booking).status : result.error);
}
