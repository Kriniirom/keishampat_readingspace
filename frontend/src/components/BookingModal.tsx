'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle2, Banknote, QrCode } from 'lucide-react';
import { Seat, BookingResult, bookingRequest, fetchSeats } from '../lib/api';
import { PRICING } from '../lib/pricing';

export const UPI_CONFIG = { id: 'krinivash-2@oksbi', name: 'Irom Krinivash singh' };
export const ENABLE_MORNING_SHIFT = false;
export const ENABLE_EVENING_SHIFT = false;
type Shift = 'morning' | 'evening' | 'fullday' | 'daypass';
export interface BookingModalProps {
  seat: Seat | null; seats?: Seat[]; isOpen: boolean; onClose: () => void; onSuccess: () => void;
  initialMode?: 'new' | 'renew'; initialShift?: Shift; initialDuration?: number;
}
const field = 'w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-900';
const button = 'rounded-xl bg-[#113826] px-4 py-3 text-sm font-bold text-white disabled:opacity-50';
const indiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const draftKey = 'krs_registration_request_v4';
const referenceKey = 'krs_last_booking_v4';

function readStored(key: string) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function saveStored(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

export default function BookingModal({ seat, isOpen, onClose, onSuccess, initialMode = 'new', initialShift = 'fullday', initialDuration = 1 }: BookingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'new' | 'renew'>(initialMode);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatId, setSeatId] = useState(0);
  const [shift, setShift] = useState<'fullday' | 'daypass'>('fullday');
  const [duration, setDuration] = useState(1);
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [address, setAddress] = useState('');
  const [start, setStart] = useState(indiaToday);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [method, setMethod] = useState<'upi' | 'cash'>('upi'); const [transaction, setTransaction] = useState('');
  const [busy, setBusy] = useState(false); const [loadingSeats, setLoadingSeats] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [copied, setCopied] = useState(false);
  const working = useRef(false); const submission = useRef<any>(null); const renewalRequest = useRef('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const paymentRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result?.renewal?.status === 'Awaiting payment' || (result?.renewal?.status === 'Pending' && !result.renewal.paymentSubmitted)) {
      paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      paymentRef.current?.focus({ preventScroll: true });
    }
  }, [result?.renewal?.requestId, result?.renewal?.status]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode); setShift(initialShift === 'daypass' ? 'daypass' : 'fullday'); setDuration(initialDuration);
    setResult(null); setError(''); setNotice(''); setTransaction(''); setCopied(false);
    submission.current = readStored(draftKey);
    if (submission.current) {
      const d = submission.current;
      setName(d.name || ''); setPhone(d.phone || ''); setAddress(d.address || ''); setStart(d.startDate || indiaToday());
      setSeatId(d.seatId); setShift(d.shift); setDuration(d.durationMonths);
      setNotice('A registration request is saved on this device. Retry it below to recover the same booking. Do not pay again.');
    } else setSeatId(seat?.id || 0);
    let cancelled = false;
    setSeats([]); setLoadingSeats(true);
    fetchSeats().then(data => {
      if (cancelled) return;
      setSeats(data.seats);
      if (!seat && !submission.current) setSeatId(data.seats.find(s => s.status === 'available')?.id || 0);
    }).catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setLoadingSeats(false); });
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { cancelled = true; document.body.style.overflow = overflow; previous?.focus(); };
  }, [isOpen, initialMode, initialShift, initialDuration, seat?.id]);

  async function run(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e: any) { setError(e.message || 'Please retry the same request. Do not pay again.'); }
    finally { working.current = false; setBusy(false); }
  }
  function receive(r: BookingResult) {
    setResult(r);
    saveStored(referenceKey, { bookingId: r.booking.bookingId });
    setTransaction(r.renewal?.transactionRef || r.booking.transactionRef || '');
    setMethod((r.renewal?.paymentMethod || r.booking.paymentMethod || '').toLowerCase().includes('cash') ? 'cash' : 'upi');
  }
  function register(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      if (!submission.current) {
        submission.current = { action: 'createBooking', requestId: crypto.randomUUID(), name: name.trim(), phone: phone.trim(), address: address.trim(), seatId, shift, durationMonths: shift === 'daypass' ? 1 : duration, startDate: start };
        saveStored(draftKey, submission.current);
      }
      const r = await bookingRequest(submission.current);
      receive(r); submission.current = null; saveStored(draftKey, null);
      setNotice('Registration saved. Complete payment below; reception will verify receipt. You can check your status later using your registered phone number.');
      onSuccess();
    });
  }
  async function refresh() {
    const r = await bookingRequest({ action: 'lookup', ...(result ? { bookingId: result.booking.bookingId } : {}), phone: phone.trim() });
    receive(r); setNotice('Status checked. Please do not register or pay again if verification is pending.');
  }
  function renew() {
    run(async () => {
      const key = `krs_renewal_${result.booking.bookingId}_${result.booking.expiry}`;
      renewalRequest.current = readStored(key) || crypto.randomUUID(); saveStored(key, renewalRequest.current);
      const r = await bookingRequest({ action: 'renewBooking', requestId: renewalRequest.current, bookingId: result.booking.bookingId, phone });
      receive(r); setNotice('Renewal request saved. Your current expiry stays unchanged until payment is verified.');
    });
  }
  function report(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      const r = await bookingRequest({ action: 'reportPayment', bookingId: result.booking.bookingId, phone, renewalId: result.renewal?.requestId, paymentMethod: method, transactionRef: transaction.trim() });
      receive(r); setNotice('Payment details saved. Reception will verify the money received. Please do not pay or register again.'); onSuccess();
    });
  }
  if (!mounted || !isOpen) return null;
  const target = result?.renewal || result?.booking;
  const pending = target && /pending|awaiting/i.test(target.status);
  const awaiting = pending && !(target?.paymentSubmitted ?? (/verification/i.test(target?.status || '') || /cash/i.test(target?.paymentMethod || '') || !!target?.transactionRef));
  const amount = target?.amount || '';
  const canRenew = !!result && /^(confirm|confirmed|active|paid|expired)$/i.test(result.booking.status);
  const showRenewal = !!result && result.booking.shift !== 'daypass' && (!result.renewal || /^confirm(ed)?$/i.test(result.renewal.status));
  const upi = `upi://pay?pa=${encodeURIComponent(UPI_CONFIG.id)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${amount.replace(/[^\d.]/g, '')}&cu=INR&tn=${encodeURIComponent('KRS ' + result?.booking.bookingId)}`;
  const whatsapp = result ? `https://wa.me/919863429955?text=${encodeURIComponent(`Hello, please check my ${result.renewal ? 'renewal' : 'booking'} ${result.booking.bookingId}. Seat: ${result.booking.seat}. Amount: ${amount}. Status: ${target.status}. Transaction reference: ${transaction || 'Not supplied'}.`)}` : '';

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-3" onKeyDown={e => {
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab') {
        const items = e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)');
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="booking-title" className="bg-[#FAF8F5] rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <header className="sticky top-0 bg-[#113826] text-white p-4 flex justify-between items-center z-10">
          <h2 id="booking-title" className="font-bold">Registration & membership status</h2>
          <button ref={closeRef} onClick={onClose} disabled={busy} aria-label="Close dialog"><X /></button>
        </header>
        <div className="p-5 space-y-4">
          {!result && <div className="flex gap-2">
            <button className={mode === 'new' ? button : field} disabled={busy} onClick={() => { setMode('new'); setError(''); }}>New registration</button>
            <button className={mode === 'renew' ? button : field} disabled={busy} onClick={() => { setMode('renew'); setError(''); }}>Check status / Renew</button>
          </div>}
          <p className="text-sm text-stone-600">Already registered? Check your status or renew your membership below. If a payment is awaiting verification, please do not pay it again.</p>
          {error && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">{notice}</p>}
          {!result && mode === 'new' && <form onSubmit={register} className="space-y-3">
            <fieldset disabled={busy || !!submission.current} className="space-y-3 disabled:opacity-70">
              <label className="block text-sm">Full name<input required className={field} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
              <label className="block text-sm">Registered phone<input required type="tel" className={field} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" /></label>
              <label className="block text-sm">Address / locality<input required className={field} value={address} onChange={e => setAddress(e.target.value)} /></label>
              <label className="block text-sm">Seat<select required className={field} value={seatId || ''} onChange={e => setSeatId(+e.target.value)}><option value="">{loadingSeats ? 'Checking availability…' : 'Select an available seat'}</option>{seats.map(s => <option key={s.id} value={s.id} disabled={s.status === 'occupied'}>{s.seatNumber} — {s.status}</option>)}</select></label>
              <label className="block text-sm">Start date<input required type="date" min={indiaToday()} className={field} value={start} onChange={e => setStart(e.target.value)} /></label>
              <label className="block text-sm">Plan<select className={field} value={shift === 'daypass' ? 'daypass' : String(duration)} onChange={e => { setShift(e.target.value === 'daypass' ? 'daypass' : 'fullday'); setDuration(e.target.value === '3' ? 3 : 1); }}><option value="1">Monthly — ₹{PRICING.MONTHLY_FEE}</option><option value="3">3 months — ₹{PRICING.QUARTERLY_FEE}</option><option value="daypass">1-day pass — ₹{PRICING.DAILY_PASS_FEE}</option></select></label>
            </fieldset>
            <button className={button + ' w-full'} disabled={busy || (!submission.current && (loadingSeats || !seats.length || !seatId))}>{busy ? 'Saving…' : submission.current ? 'Retry saved registration request' : 'Save registration & continue to payment'}</button>
            {submission.current && <button type="button" className="text-sm underline" disabled={busy} onClick={() => { submission.current = null; saveStored(draftKey, null); setNotice('You can correct your details. If the previous request was saved, duplicate protection will prevent another registration.'); }}>Correct details</button>}
            <p className="text-xs text-stone-600">Save your registration before making payment. Payment is verified manually by reception.</p>
          </form>}
          {!result && mode === 'renew' && <form className="space-y-3" onSubmit={e => { e.preventDefault(); run(refresh); }}>
            <label className="block text-sm">Registered phone<input required type="tel" className={field} value={phone} onChange={e => setPhone(e.target.value)} /></label>
            <button className={button} disabled={busy}>{busy ? 'Checking…' : 'Check booking status'}</button>
            <p className="text-xs text-stone-600">Enter the phone number used when registering. You do not need a booking ID. For help, contact reception on 98634 29955.</p>
          </form>}
          {result && <>
            <div className="rounded-xl bg-white border border-stone-200 p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-[#113826]"><CheckCircle2 />{/^confirm(ed)?$/i.test(target.status) ? 'Payment verified — confirmed' : result.renewal ? 'Renewal request saved' : 'Registration saved'}</div>
              <p className="font-mono font-bold break-all text-lg">{result.booking.bookingId}</p>
              <button type="button" className="text-sm underline" onClick={async () => { try { await navigator.clipboard.writeText(result.booking.bookingId); setCopied(true); } catch { setNotice('Please note or screenshot your booking ID.'); } }}>{copied ? 'Copied' : 'Copy booking ID'}</button>
              <dl className="grid grid-cols-2 gap-2 text-sm"><dt>Name</dt><dd>{result.booking.name}</dd><dt>Desk</dt><dd>{result.booking.seat}</dd><dt>Start date</dt><dd>{result.booking.startDate}</dd><dt>Membership expiry</dt><dd>{result.booking.expiry}</dd><dt>Membership status</dt><dd>{result.booking.status}</dd><dt>{result.renewal ? 'Renewal amount' : 'Amount due'}</dt><dd>{amount}</dd><dt>Payment status</dt><dd className="font-bold">{target.status}</dd>{result.renewal && <><dt>Expiry after approval</dt><dd>{result.renewal.newExpiry}</dd></>}</dl>
            </div>
            {showRenewal && <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="font-bold text-[#113826]">Monthly renewal</h3>
              <p id="renewal-help" className="text-sm text-stone-700">{canRenew
                ? (/^expired$/i.test(result.booking.status)
                  ? 'Renew your expired membership for one month starting today. We will check that your seat is available before showing payment details.'
                  : 'Continue with your existing booking for one more month. Review the renewal amount and new expiry, then pay by UPI or at reception.')
                : 'Reception must confirm your current registration payment before you can pay for a renewal. Contact reception below, then refresh your status.'}</p>
              <button type="button" className={button + ' w-full'} disabled={busy || !canRenew} aria-describedby="renewal-help" onClick={renew}>{busy ? 'Please wait…' : 'Pay for monthly renewal'}</button>
            </div>}
            {awaiting && <form ref={paymentRef} tabIndex={-1} aria-label={result.renewal ? 'Renewal payment' : 'Registration payment'} onSubmit={report} className="space-y-3 rounded-xl border border-stone-200 p-4">
              <h3 className="font-bold text-[#113826]">{result.renewal ? 'Pay for monthly renewal' : 'Complete registration payment'}</h3>
              <fieldset disabled={busy}>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-700">Payment option ({amount}) <span aria-hidden="true">*</span></legend>
                <div className="grid grid-cols-2 gap-2">
                  {([{ value: 'cash', label: 'Cash at Counter', Icon: Banknote }, { value: 'upi', label: 'UPI Payment', Icon: QrCode }] as const).map(({ value, label, Icon }) => (
                    <label key={value} className="relative cursor-pointer">
                      <input type="radio" name="paymentMethod" value={value} checked={method === value} onChange={() => setMethod(value)} required className="peer sr-only" />
                      <span className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border border-[#ded4c6] bg-white px-3 py-2 text-xs font-bold text-stone-700 transition-colors peer-checked:border-[#113826] peer-checked:bg-[#113826] peer-checked:text-white peer-checked:shadow-[0_0_0_2px_#b8c8bf] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[#113826] peer-disabled:cursor-wait peer-disabled:opacity-50">
                        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {method === 'upi' ? <>
                <p className="text-sm">Pay {amount} to <strong>{UPI_CONFIG.name}</strong><br /><span className="select-all">{UPI_CONFIG.id}</span></p>
                <a className={button + ' block text-center'} href={upi}>{result.renewal ? 'Pay renewal' : 'Pay'} {amount} with UPI</a>
                <img className="mx-auto" width={160} height={160} src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upi)}`} alt="Scan to pay using your UPI app" />
                <label className="block text-sm">UPI transaction reference (UTR)<input required minLength={6} maxLength={80} pattern="[a-zA-Z0-9-]{6,80}" className={field} value={transaction} onChange={e => setTransaction(e.target.value)} placeholder="From your payment app receipt" /></label>
                <p className="text-xs text-stone-600">After paying, return here and submit the reference. If you have already paid, enter that payment’s reference; do not pay again.</p>
              </> : <p className="text-sm">Pay {amount} at reception. Your request remains pending until staff verify receipt.</p>}
              <button className={button + ' w-full'} disabled={busy}>{busy ? 'Saving…' : method === 'upi' ? 'I have paid — submit for verification' : 'Request cash payment verification'}</button>
            </form>}
            {pending && !awaiting && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Payment verification is pending. Reception will confirm after checking receipt. Do not pay again. Use Refresh status below.</p>}
            <div className="flex flex-wrap gap-3">
              <button className={button} disabled={busy} onClick={() => run(refresh)}>Refresh status</button>
              <a className={button} href={whatsapp} target="_blank" rel="noopener noreferrer">Contact reception on WhatsApp</a>
            </div>
            <p className="text-xs text-stone-600">Save or screenshot this receipt. Use your registered phone number in Check status / Renew when you return.</p>
          </>}
          {busy && <p role="status" className="flex gap-2 text-sm"><Loader2 className="animate-spin w-4 h-4" />Please wait. Keep this window open.</p>}
        </div>
      </section>
    </div>, document.body);
}
