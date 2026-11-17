# Activate reliable registration and renewal

The repository changes are not a live deployment. Deploy the script and configure the Next.js server together. No payment gateway is required. Do not enable bookings on a build-only/static host: `/api/booking` requires a running Next.js server (for example, a host supporting Next.js route handlers).

## 1. Preserve existing records

- Make a backup copy of the Google spreadsheet and existing Apps Script before replacing the script.
- Keep the existing Bookings sheet and its first 13 columns in their current order. The replacement checks their headings and locates Request ID, Shift, Transaction Ref, Created At, Verified At by heading after column M. Missing fields are appended after existing columns. An extra legacy Status column in N, other custom columns, and their formulas are preserved; column J remains the authoritative membership Status.
- Renewals and Inquiries are separate sheets, created as needed. Visitors remains supported.
- Existing duplicates are not deleted. For repeated booking IDs, the latest row is treated as authoritative. Different IDs for the same person still need manual review. Cancel the redundant record only after checking payment and seat ownership.
- Review old `Confirmed` records against actual payments: the old website assigned that status without verification. Existing short IDs and phone numbers are not strong identity proof. New IDs are random and remain internal references. Customers look up their membership using their registered phone number only; this is not OTP authentication. Phone lookup prefers a single current membership, otherwise the newest past record. Multiple current memberships on the same phone require reception assistance.
- Legacy dates should be actual sheet dates or YYYY-MM-DD / DD-MM-YYYY / DD/MM/YYYY text. Correct ambiguous or invalid dates before launch. The script refuses unsafe renewal calculations.

## 2. Update Apps Script

1. Replace the old code with `Code.gs` in this folder. Do not leave the old `doGet` / `doPost` definitions alongside it.
2. Check SPREADSHEET_ID at the top. Initially test against a COPY of the spreadsheet.
3. In Project Settings → Script Properties, add two different long random values:
   - `API_SECRET`: used only by the Next.js server.
   - `ADMIN_SECRET`: used only by authorized administration. Do not put this in frontend code, public widgets, URLs, or source control.
4. Set the Apps Script project timezone to Asia/Kolkata.
5. Deploy a new version of the existing web app deployment (execute as the sheet owner, accessible to requests from the website server). Copy its `/exec` URL.
6. Old web app deployments that still expose customer rows must also be disabled/updated; changing the source alone does not update their deployed versions.

The new public GET deliberately returns no customer records. If Appsmith currently lists records using the old public GET, switch that query to your private Google Sheets datasource. No unrestricted customer-list endpoint is provided.

## 3. Configure and deploy the website

Add these server environment variables in the website host (or `frontend/.env.local` locally):

```text
APPS_SCRIPT_URL=<the deployed /exec URL>
APPS_SCRIPT_SECRET=<same value as API_SECRET>
```

Use `frontend/.env.example` as a template. Never use NEXT_PUBLIC_ for either secret. Restart/redeploy Next.js after changing environment values. If configuration is missing or the old script responds, booking fails closed with an explanatory error; it will not fabricate a successful receipt.

The server forwards only approved customer actions, adds API_SECRET, reads the real JSON response, and checks protocol version 2. It never forwards admin actions. Prices and expiry dates are calculated by Apps Script, not trusted from the browser. If changing prices later, update both `frontend/src/lib/pricing.ts` and Apps Script amounts.

## 4. Verify direct UPI or cash payments

The Status column uses only `Confirm`, `Pending`, and `Expired`. New registration → `Pending` (seat reserved immediately) → customer submits UTR / cash request → still `Pending` → staff checks actual receipt → `Confirm`. Rejected requests are marked `Expired` and release the seat. Payment method and transaction reference track submission separately, so a submitted payment is not requested again. Legacy status names are accepted when reading existing records.

Pending and confirmed seats appear orange and cannot be selected; available seats appear green. The booking page refreshes every 15 seconds and when the window regains focus. Apps Script serializes availability checks and booking writes with a script lock, so a stale browser cannot create a second overlapping booking.

Renewal: one request in Renewals → payment verification → the existing Bookings row gets the fixed approved expiry. It does not create another membership. Retrying approval cannot extend it twice.

### Option A: spreadsheet administration (ready to use)

From the spreadsheet-bound Apps Script editor, run `installAdminMenu` once and authorize it. Reload the spreadsheet. Use the **Booking payments** menu to approve or reject. Enter the booking ID and, for renewals, the Request ID from Renewals. The menu asks you to confirm that you checked money received.

Do not simply change a renewal's Status cell to Confirm: that bypasses the operation that updates membership expiry. Use the menu or authenticated action below. After approval, the customer clicks Refresh status to see the updated receipt.

### Option B: private Appsmith dashboard

Keep the dashboard private and restricted to authorized staff. Read Bookings and Renewals using a private Google Sheets datasource. Show pending registrations separately from pending renewals.

Your private server-side administration query can POST JSON to the `/exec` URL:

```json
{
  "action": "approvePayment",
  "adminSecret": "<ADMIN_SECRET from protected server-side configuration>",
  "bookingId": "<selected Booking ID>",
  "renewalId": "<selected renewal Request ID; omit for admission>"
}
```

Use `rejectPayment` to reject. Check `success` in the JSON response before displaying approval. Refresh both tables afterward. Do not store the admin secret in client-side JS objects or public app state. If your Appsmith configuration cannot keep this query/secret restricted, use the spreadsheet menu instead. The Appsmith app has not been edited in this repository.

Pending registrations hold the seat through their proposed membership period (including the monthly grace period); staff should reject abandoned registrations promptly. Memberships marked `Expired` may renew from today if the seat is available. Confirmed memberships retain the existing seven-day renewal grace policy. A pending renewal reserves the proposed period and appears orange without extending the membership expiry; approval checks availability again and applies the new expiry. Day passes have no seven-day grace period.

## 5. Check before switching to the live sheet

Run `node --test apps-script/booking.test.cjs` from the repository root and `npm run build` inside frontend. These tests use an in-memory sheet, never live customer data.

On a test-sheet deployment, exercise:

- Register, save the ID, close and reopen, then check using the registered phone number only.
- Retry after a simulated lost response: one registration row only.
- Submit a UPI reference: pending, never automatically paid. Verify/reject using the menu.
- Request renewal twice: one pending renewal, unchanged membership expiry.
- Approve renewal twice: expiry extends once, no extra membership row.
- Refresh after approval: updated status and expiry.
- Try the same seat from two devices: one registration must be rejected.
- Disable Apps Script or misconfigure the secret: show an error, never a fake confirmation or available-seat fallback.
- Confirm inquiries appear under Inquiries and visitor logging still works.

No real payment is needed to test the copied sheet. Automatic customer SMS/WhatsApp/email is not configured; customers use their saved reference, status screen and manual WhatsApp contact. Owner email alerts are retained (recipient in `notifyOwner_`); notification failures never change a successful save into a failure. Change or disable that helper when testing against a copied sheet if you do not want test alerts.
