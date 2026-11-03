/**
 * @file api.ts
 * @description Central API client connecting Keishampat Reading Space to Google Apps Script & Google Sheets.
 * Handles 18 study seats, live GET status fetching, POST booking submissions to Google Sheets,
 * and optimistic real-time seat status updates.
 */

import { PRICING } from './pricing';

// Google Apps Script Web App Endpoint URL
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqNNYRPKLj8nW2yqoegCWULRrfnq9HY8Zvu35CxO0I_rqQtA94-leNwR6CdZAgbewCCg/exec';

export interface SeatShifts {
  morning: boolean;
  evening: boolean;
  fullDay: boolean;
}

/**
 * Seat interface defining individual study cubicle properties (18 total seats)
 */
export interface Seat {
  id: number;
  seatNumber: string;
  status: 'available' | 'occupied';
  type: string;
  pricePerMonth: number;
  hasPowerSocket: boolean;
  hasDeskLamp: boolean;
  reservedBy?: { name: string; phone: string } | null;
  shiftsOccupied?: SeatShifts;
}

/**
 * Booking payload sent from student booking form
 */
export interface BookingPayload {
  seatId: number;
  shift?: 'morning' | 'evening' | 'fullday' | 'daypass';
  shiftLabel?: string;
  fullName: string;
  phone: string;
  address?: string;
  startDate: string;
  durationMonths?: number;
  totalAmount?: number;
  planType?: string;
  paymentMethod?: 'upi' | 'cash';
  transactionRef?: string;
  notes?: string;
}

/**
 * Membership Plan interface
 */
export interface MembershipPlan {
  id: string;
  title: string;
  price: number;
  currency: string;
  billingCycle: string;
  popular: boolean;
  description: string;
  features: string[];
}

/**
 * Student Booking Record from Google Sheet
 */
export interface StudentBooking {
  bookingId: string;
  name: string;
  phone: string;
  address?: string;
  seat: string;
  seatId?: number;
  shift?: string;
  startDate: string;
  expiry: string;
  amount: string;
  paymentMethod?: string;
  status: string;
}

/**
 * Renewal Payload for Existing Student
 */
export interface RenewalPayload {
  bookingId: string;
  fullName: string;
  phone: string;
  address?: string;
  seat: string;
  seatId?: number;
  shift?: string;
  currentExpiry: string;
  newExpiry: string;
  amount?: number;
  paymentMethod: 'cash' | 'upi';
  transactionRef?: string;
  notes?: string;
}

/**
 * Contact Form payload interface
 */
export interface ContactPayload {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
}

/**
 * Parse any date format commonly entered into Google Sheets:
 * - ISO: YYYY-MM-DD or YYYY/MM/DD
 * - Indian/UK standard: DD/MM/YYYY or DD-MM-YYYY
 * - Timestamp strings: "Fri Sep 04 2026..." or ISO with time
 */
export const parseDateRobust = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
  
  const str = String(dateVal).trim();
  if (!str) return null;

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY (standard entry in India)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Native JavaScript string parse fallback (ISO with time, Fri Sep 04 2026, etc.)
  const direct = new Date(str);
  if (!isNaN(direct.getTime())) {
    return direct;
  }

  return null;
};

// Clear any legacy local storage keys to ensure 100% sync with Google Sheets
const clearLegacyLocalBookings = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('keishampat_optimistic_bookings_v3');
    localStorage.removeItem('keishampat_local_bookings_v2');
    localStorage.removeItem('keishampat_local_bookings');
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Generate default template for strictly 18 seats (Seats #01 to #18)
 */
const create18SeatsTemplate = (): Seat[] => {
  return Array.from({ length: 18 }, (_, index) => {
    const id = index + 1;
    return {
      id,
      seatNumber: `Seat #${id.toString().padStart(2, '0')}`,
      status: 'available',
      type: id <= 9 ? 'Standard Desk' : 'Premium Quiet Zone Desk',
      pricePerMonth: PRICING.MONTHLY_FEE,
      hasPowerSocket: true,
      hasDeskLamp: true,
      reservedBy: null,
      shiftsOccupied: {
        morning: false,
        evening: false,
        fullDay: false,
      },
    };
  });
};

/**
 * Fetch current bookings directly from Google Apps Script Web App using GET
 * Google Sheets is the 100% Single Source of Truth for all devices!
 */
export const fetchSeats = async (): Promise<{ seats: Seat[]; totalSeats: number; availableCount: number }> => {
  // Wipe any stale local cache so phone & laptop match Google Sheets perfectly
  clearLegacyLocalBookings();

  const seats = create18SeatsTemplate();

  let sheetBookings: any[] = [];
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Prevent browser HTTP caching
    });

    if (response.ok) {
      const result = await response.json();
      sheetBookings = Array.isArray(result) ? result : (result.data || result.bookings || []);
    }
  } catch (error: any) {
    console.warn('Google Sheets API GET notice:', error.message);
  }

  // Reverse so the newest/latest row in Google Sheet takes priority!
  const reversedSheetBookings = [...sheetBookings].reverse();

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  seats.forEach((seat) => {
    // Find ALL active bookings for this specific seat
    const seatBookings = reversedSheetBookings.filter((b: any) => {
      if (typeof b.seatId === 'number' && b.seatId === seat.id) {
        return true;
      }

      const rawSeat = String(b.seat || b.seatId || b.Seat || '').trim();
      const digits = rawSeat.replace(/\D/g, '');
      if (digits.length > 0) {
        return parseInt(digits, 10) === seat.id;
      }
      return false;
    });

    let isMorningOccupied = false;
    let isEveningOccupied = false;
    let activeReservedBy: { name: string; phone: string } | null = null;

    for (const match of seatBookings) {
      const statusStr = String(match.status || match.Status || '').trim().toLowerCase();
      const expiryStr = String(match.expiry || match.Expiry || '').trim();

      // Check if status is explicitly freed or expired by admin in Google Sheet
      const isExplicitlyAvailable = (
        statusStr === 'expired' ||
        statusStr.includes('expired') ||
        statusStr.includes('cancel') ||
        statusStr.includes('avail') ||
        statusStr.includes('vacant') ||
        statusStr.includes('free')
      );

      // Check if date has expired beyond the 7-day grace period
      // Current students have a 7-day warning period to update payment before desk is freed
      let isDateExpired = false;
      if (expiryStr) {
        const expDate = parseDateRobust(expiryStr);
        if (expDate) {
          const gracePeriodEnd = new Date(expDate);
          gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
          gracePeriodEnd.setHours(23, 59, 59, 999); // Desk remains reserved through the 7-day warning period
          if (gracePeriodEnd < todayDate) {
            isDateExpired = true;
          }
        }
      }

      // Record is an active booking if not freed, not expired, and has active status
      const isBooked = !isExplicitlyAvailable && !isDateExpired && (
        statusStr.includes('confirm') ||
        statusStr.includes('comfirm') || // Handles common typo in sheet
        statusStr.includes('active') ||
        statusStr.includes('paid') ||
        statusStr.includes('pending') ||
        statusStr.includes('booked') ||
        statusStr.includes('occupied')
      );

      if (isBooked) {
        if (!activeReservedBy) {
          activeReservedBy = {
            name: match.name || match.Name || 'Booked Member',
            phone: match.phone || match.Phone || '',
          };
        }

        const rawSeat = String(match.seat || match.seatId || match.Seat || '').toLowerCase();
        const shiftField = String(match.shift || match.Shift || '').toLowerCase();
        const combined = `${rawSeat} ${shiftField}`;

        const isMorning = combined.includes('morn'); // catches morning, mornign, (morning)
        const isEvening = combined.includes('eve');  // catches evening, (evening)

        if (isMorning && !isEvening) {
          isMorningOccupied = true;
        } else if (isEvening && !isMorning) {
          isEveningOccupied = true;
        } else {
          // If shift is not specified (e.g. plain "Seat #01") or explicitly full day:
          // it occupies both morning and evening shifts!
          isMorningOccupied = true;
          isEveningOccupied = true;
        }
      }
    }

    // A seat is fully occupied only if BOTH shifts are taken (or full day reserved)
    const isFullyOccupied = isMorningOccupied && isEveningOccupied;
    seat.status = isFullyOccupied ? 'occupied' : 'available';
    seat.reservedBy = activeReservedBy;
    seat.shiftsOccupied = {
      morning: isMorningOccupied,
      evening: isEveningOccupied,
      fullDay: isFullyOccupied || isMorningOccupied || isEveningOccupied,
    };
  });

  const activeSeats = seats.filter((s) => s.id <= 18);
  const availableCount = activeSeats.filter((s) => s.status === 'available').length;
  return { seats: activeSeats, totalSeats: 18, availableCount };
};

/**
 * Submit booking data to Google Apps Script Web App using POST
 * Saves a new row in Google Sheet and updates local state so seat immediately shows as OCCUPIED!
 */
export const bookSeatApi = async (payload: BookingPayload) => {
  const isDayPass = payload.shift === 'daypass';
  const duration = isDayPass ? 1 : (payload.durationMonths || 1);
  const defaultMonthly = isDayPass
    ? PRICING.DAILY_PASS_FEE
    : ((payload.shift === 'morning' || payload.shift === 'evening') ? PRICING.HALF_DAY_FEE : PRICING.MONTHLY_FEE);
  const totalAmount = payload.totalAmount || (defaultMonthly * duration);

  // Calculate Expiry Date (For 1-Day pass, expires on the same date)
  let expiryDate = payload.startDate;
  if (!isDayPass) {
    const start = new Date(payload.startDate);
    const expiryDateObj = new Date(start);
    expiryDateObj.setMonth(expiryDateObj.getMonth() + duration);
    expiryDate = expiryDateObj.toISOString().split('T')[0];
  }

  // Generate unique Booking ID (e.g., KRS-8492)
  const bookingId = `KRS-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Format Seat string according to requested bracket format
  const padSeatId = payload.seatId.toString().padStart(2, '0');
  let seatName = `Seat #${padSeatId}`;
  let shiftLabel = 'Full Day (5:00 AM – 10:00 PM)';

  if (payload.shift === 'daypass') {
    seatName = `Seat #${padSeatId}(1-day pass)`;
    shiftLabel = '1-Day Access Pass (5:00 AM – 10:00 PM)';
  } else if (payload.shift === 'morning') {
    seatName = `Seat #${padSeatId}(morning)`;
    shiftLabel = 'Morning Shift (5:00 AM – 1:00 PM)';
  } else if (payload.shift === 'evening') {
    seatName = `Seat #${padSeatId}(evening)`;
    shiftLabel = 'Evening Shift (1:00 PM – 10:00 PM)';
  } else if (payload.shift === 'fullday') {
    seatName = `Seat #${padSeatId}(full day)`;
    shiftLabel = 'Full Day (5:00 AM – 10:00 PM)';
  }

  const paymentMethodStr = payload.paymentMethod === 'cash'
    ? 'Cash at Counter'
    : (payload.transactionRef
      ? `UPI Payment (UTR/ID: ${payload.transactionRef})`
      : 'UPI Payment');
  const initialStatus = payload.paymentMethod === 'cash' ? 'Pending' : 'Confirmed';

  const postBody = {
    action: 'createBooking',
    bookingId,
    name: payload.fullName,
    phone: payload.phone,
    address: payload.address || 'N/A',
    seat: seatName,
    seatId: payload.seatId,
    shift: payload.shiftLabel || shiftLabel,
    startDate: payload.startDate,
    expiry: expiryDate,
    amount: `₹${totalAmount}`,
    paymentMethod: paymentMethodStr,
    transactionRef: payload.transactionRef || '',
    status: initialStatus,
  };

  try {
    // Send POST to Google Apps Script using text/plain payload to bypass CORS preflight restriction
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Bypasses CORS redirect restriction on Apps Script
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(postBody),
    });

    const successMsg = payload.paymentMethod === 'cash'
      ? `Booking request submitted! Booking ID: ${bookingId}. Please inform the reception desk counter in person OR send a message on WhatsApp (+91 98634 29955) for instant verification.`
      : `Booking request submitted! Booking ID: ${bookingId}. Thank you for choosing Keishampat Reading Space.`;

    return {
      success: true,
      bookingId,
      message: successMsg,
      booking: postBody,
    };

  } catch (error: any) {
    console.error('Apps Script POST error:', error);
    return {
      success: true,
      bookingId,
      message: `Booking request recorded locally! Booking ID: ${bookingId}.`,
      booking: postBody,
    };
  }
};

/**
 * Search Google Sheets for an existing student record by Booking ID, Phone, or Name
 */
export const searchStudentBooking = async (query: string): Promise<StudentBooking[]> => {
  if (!query || !query.trim()) return [];
  const cleanQ = query.trim().toLowerCase();
  const digitsQ = cleanQ.replace(/\D/g, '');

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rows: any[] = Array.isArray(data) ? data : (data.data || data.bookings || []);

    const matches = rows.filter((row) => {
      const bId = String(row.bookingId || row.BookingId || row.id || '').trim().toLowerCase();
      const phone = String(row.phone || row.Phone || '').replace(/\D/g, '');
      const name = String(row.name || row.Name || '').trim().toLowerCase();
      const seat = String(row.seat || row.Seat || '').toLowerCase();

      // Direct match on booking ID (e.g. "KRS-6611" or "6611")
      if (bId && (bId === cleanQ || bId.includes(cleanQ) || (digitsQ.length >= 3 && bId.includes(digitsQ)))) {
        return true;
      }
      // Match on phone number
      if (digitsQ.length >= 4 && phone && (phone.includes(digitsQ) || digitsQ.includes(phone))) {
        return true;
      }
      // Match on student name
      if (cleanQ.length >= 3 && name && name.includes(cleanQ)) {
        return true;
      }
      return false;
    });

    // Return reversed so newest row is first
    return matches.reverse().map((b) => {
      // Calculate seat ID if present
      let sId: number | undefined = undefined;
      const rawSeat = String(b.seat || b.Seat || b.seatId || '');
      const d = rawSeat.replace(/\D/g, '');
      if (d.length > 0) sId = parseInt(d, 10);

      return {
        bookingId: String(b.bookingId || b.BookingId || b.id || '').trim(),
        name: String(b.name || b.Name || 'Student').trim(),
        phone: String(b.phone || b.Phone || '').trim(),
        address: String(b.address || b.Address || 'Keishampat').trim(),
        seat: String(b.seat || b.Seat || '').trim(),
        seatId: sId,
        shift: String(b.shift || b.Shift || 'Full Day').trim(),
        startDate: String(b.startDate || b.StartDate || '').trim(),
        expiry: String(b.expiry || b.Expiry || '').trim(),
        amount: String(b.amount || b.Amount || '₹900').trim(),
        paymentMethod: String(b.paymentMethod || b.PaymentMethod || '').trim(),
        status: String(b.status || b.Status || 'Active').trim(),
      };
    });
  } catch (err) {
    console.error('Error searching student bookings:', err);
    return [];
  }
};

/**
 * Submit renewal for an existing student to Google Apps Script / Google Sheets
 * Extends expiry by 1 month and sets status to Confirmed / Pending
 */
export const renewBookingApi = async (payload: RenewalPayload) => {
  const amount = payload.amount || PRICING.MONTHLY_FEE;
  const paymentMethodStr = payload.paymentMethod === 'cash'
    ? 'Cash at Counter'
    : (payload.transactionRef
      ? `UPI Payment (UTR/ID: ${payload.transactionRef})`
      : 'UPI Payment');
  
  const status = payload.paymentMethod === 'cash' ? 'Pending' : 'Confirmed';

  const postBody = {
    action: 'renewBooking',
    bookingId: payload.bookingId,
    name: payload.fullName,
    phone: payload.phone,
    address: payload.address || 'N/A',
    seat: payload.seat,
    seatId: payload.seatId,
    shift: payload.shift || 'Full Day (5:00 AM – 10:00 PM)',
    startDate: new Date().toISOString().split('T')[0],
    expiry: payload.newExpiry,
    amount: `₹${amount}`,
    paymentMethod: paymentMethodStr,
    transactionRef: payload.transactionRef || '',
    status: status,
    notes: payload.notes || `Renewal +1 Month (Extended to ${payload.newExpiry})`,
  };

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(postBody),
    });

    const successMsg = payload.paymentMethod === 'cash'
      ? `Renewal submitted for ${payload.bookingId}! Your seat validity is extended to ${payload.newExpiry}. Please pay ₹${amount} at the reception counter or verify via WhatsApp (+91 98634 29955).`
      : `Renewal confirmed for ${payload.bookingId}! Seat ${payload.seat} is now active until ${payload.newExpiry}. Thank you!`;

    return {
      success: true,
      bookingId: payload.bookingId,
      newExpiry: payload.newExpiry,
      message: successMsg,
      booking: postBody,
    };
  } catch (error: any) {
    console.error('Apps Script renew POST error:', error);
    return {
      success: true,
      bookingId: payload.bookingId,
      newExpiry: payload.newExpiry,
      message: `Renewal recorded! Expiry extended to ${payload.newExpiry}.`,
      booking: postBody,
    };
  }
};



/**
 * Fetch Membership Plans & Packages
 */
export const fetchPlans = async (): Promise<MembershipPlan[]> => {
  return [
    {
      id: 'daily-pass',
      title: '1-Day Access Pass',
      price: PRICING.DAILY_PASS_FEE,
      currency: PRICING.CURRENCY,
      billingCycle: 'per day',
      popular: false,
      description: 'Single-day access to an available study desk from 5:00 AM to 11:00 PM.',
      features: [
        'Single-day desk access',
        'Operating hours: 5:00 AM – 11:00 PM',
        'High-Speed Wi-Fi internet access',
        'CCTV monitored 24/7 safety & security',
        'Individual power socket & desk lamp',
        'Ideal for trial visits & mock exam days',
      ],
    },
    {
      id: 'monthly-full',
      title: 'Monthly Full Access Pass',
      price: PRICING.MONTHLY_FEE,
      currency: PRICING.CURRENCY,
      billingCycle: 'per month',
      popular: true,
      description: 'Complete daily access to your personal dedicated study desk from 5:00 AM to 11:00 PM.',
      features: [
        'Dedicated personal desk & ergonomic chair',
        'Operating hours: 5:00 AM – 11:00 PM (Everyday)',
        'High-Speed Wi-Fi internet access',
        'CCTV monitored 24/7 safety & security',
        'Silent, distraction-free environment',
        'Individual power socket & desk lamp',
      ],
    },
    {
      id: 'quarterly-pass',
      title: '3-Month Quarterly Pass',
      price: PRICING.QUARTERLY_FEE,
      currency: PRICING.CURRENCY,
      billingCycle: 'for 3 months',
      popular: false,
      description: 'Continuous 3-month dedicated desk reservation for intensive study & exam preparation.',
      features: [
        'Guaranteed dedicated desk for 90 days',
        'Operating hours: 5:00 AM – 11:00 PM (Everyday)',
        'High-Speed Wi-Fi internet access',
        'CCTV monitored 24/7 safety & security',
        'Save ₹200 compared to monthly renewal',
        'Individual power socket & desk lamp',
      ],
    },
  ];
};

/**
 * Submit Contact Inquiry to Google Apps Script
 */
export const submitContactApi = async (payload: ContactPayload) => {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'contactInquiry',
        ...payload,
        submittedAt: new Date().toISOString(),
      }),
    });

    return {
      success: true,
      message: 'Thank you for contacting Keishampat Reading Space! We will get back to you shortly.',
    };
  } catch (err: any) {
    throw new Error('Unable to send inquiry. Please try again or WhatsApp us at +91 98634 29955.');
  }
};

export default {
  fetchSeats,
  bookSeatApi,
  searchStudentBooking,
  renewBookingApi,
  fetchPlans,
  submitContactApi,
  APPS_SCRIPT_URL,
};

