import { PRICING } from './pricing';

// Anonymous visitor logging only. Booking requests use the authenticated server route.
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLGAoNzgiTgb12QSBdy2jPh5cVeHuBNRdMIrrdNCMCNF3vf6hTW37eJ9eHUagW-zHzWA/exec';
export interface SeatShifts { morning: boolean; evening: boolean; fullDay: boolean }
export interface Seat {
  id: number; seatNumber: string; status: 'available' | 'occupied' | 'unknown'; type: string;
  pricePerMonth: number; hasPowerSocket: boolean; hasDeskLamp: boolean;
  isPending?: boolean;
  reservedBy?: { name: string; phone: string } | null;
  shiftsOccupied?: SeatShifts; isInGracePeriod?: boolean; graceDaysRemaining?: number;
}
export interface StudentBooking {
  bookingId: string; name: string; phone: string; address?: string; seat: string; seatId?: number;
  shift?: string; startDate: string; expiry: string; amount: string; paymentMethod?: string;
  status: string; paymentSubmitted?: boolean; transactionRef?: string;
}
export interface RenewalRecord {
  requestId: string; bookingId: string; newExpiry: string; amount: string;
  paymentMethod: string; transactionRef: string; status: string; paymentSubmitted?: boolean;
}
export interface BookingResult { success: boolean; booking: StudentBooking; renewal?: RenewalRecord | null }
export interface MembershipPlan {
  id: string; title: string; price: number; currency: string; billingCycle: string;
  popular: boolean; description: string; features: string[];
}
export interface ContactPayload { name: string; phone: string; email?: string; subject?: string; message: string }

export async function bookingRequest<T = BookingResult>(body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  } catch {
    throw new Error('We could not confirm the result. Retry this same request or check your status. Do not register or pay again.');
  }
  let result: any;
  try { result = await response.json(); } catch { throw new Error('Unable to check the result. Please retry the same request. Do not pay again.'); }
  if (!response.ok || !result.success) throw new Error(result.error || 'Request could not be saved. Please try again.');
  return result;
}

export const parseDateRobust = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return new Date(value);
  const s = String(value);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const d = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : dmy ? new Date(+dmy[3], +dmy[2] - 1, +dmy[1]) : new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

export async function fetchSeats(): Promise<{ seats: Seat[]; totalSeats: number; availableCount: number }> {
  const result = await bookingRequest<{ bookings: Array<Partial<StudentBooking>> }>({ action: 'seats' });
  if (!Array.isArray(result.bookings)) throw new Error('Seat availability could not be loaded.');
  const seats: Seat[] = Array.from({ length: 18 }, (_, index) => {
    const id = index + 1;
    const matches = result.bookings.filter(b => b.seatId === id && !/^(expired|rejected|cancelled)$/i.test(b.status || ''));
    const morning = matches.some(b => b.shift !== 'evening');
    const evening = matches.some(b => b.shift !== 'morning');
    return {
      id, seatNumber: `Seat #${String(id).padStart(2, '0')}`,
      status: morning || evening ? 'occupied' : 'available',
      isPending: matches.some(b => /pending|awaiting/i.test(b.status || '')),
      type: 'Study Desk', pricePerMonth: PRICING.MONTHLY_FEE,
      hasPowerSocket: true, hasDeskLamp: true,
      shiftsOccupied: { morning, evening, fullDay: morning || evening },
    };
  });
  return { seats, totalSeats: 18, availableCount: seats.filter(s => s.status === 'available').length };
}

export async function fetchPlans(): Promise<MembershipPlan[]> {
  return [
    { id: 'daily-pass', title: '1-Day Access Pass', price: PRICING.DAILY_PASS_FEE, billingCycle: 'per day', popular: false, description: 'One day at an available study desk.' },
    { id: 'monthly-full', title: 'Monthly Full Access Pass', price: PRICING.MONTHLY_FEE, billingCycle: 'per month', popular: true, description: 'Your dedicated study desk for one month.' },
    { id: 'quarterly-pass', title: '3-Month Quarterly Pass', price: PRICING.QUARTERLY_FEE, billingCycle: 'for 3 months', popular: false, description: `Save ₹${PRICING.MONTHLY_FEE * 3 - PRICING.QUARTERLY_FEE} compared with three monthly payments.` },
  ].map(p => ({ ...p, currency: PRICING.CURRENCY, features: ['Personal study desk', 'High-speed Wi-Fi', 'Individual power socket and desk lamp', 'Silent study environment', 'Direct UPI or cash payment'] }));
}

export async function submitContactApi(payload: ContactPayload) {
  return bookingRequest<{ success: boolean; message: string }>({ action: 'contactInquiry', ...payload });
}
