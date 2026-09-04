/**
 * @file api.ts
 * @description Central API client connecting Keishampat Reading Space to Google Apps Script & Google Sheets.
 * Handles 18 study seats, live GET status fetching, POST booking submissions to Google Sheets,
 * and optimistic real-time seat status updates.
 */

// Google Apps Script Web App Endpoint URL
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqNNYRPKLj8nW2yqoegCWULRrfnq9HY8Zvu35CxO0I_rqQtA94-leNwR6CdZAgbewCCg/exec';

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
}

/**
 * Booking payload sent from student booking form
 */
export interface BookingPayload {
  seatId: number;
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
 * Contact Form payload interface
 */
export interface ContactPayload {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
}

// Local cache key for optimistic real-time booking status (v3 clean)
const LOCAL_BOOKINGS_KEY = 'keishampat_optimistic_bookings_v3';

const getLocalBookings = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalBooking = (booking: any) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalBookings();
    const updated = [booking, ...current];
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to cache local booking:', e);
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
      pricePerMonth: 900,
      hasPowerSocket: true,
      hasDeskLamp: true,
      reservedBy: null,
    };
  });
};

/**
 * Fetch current bookings from Google Apps Script Web App using GET
 * Maps Google Sheet records + recent local bookings to 18 seats:
 * - Active / Paid / Confirmed / Pending → marked as occupied/booked
 * - Available → selectable
 */
export const fetchSeats = async (): Promise<{ seats: Seat[]; totalSeats: number; availableCount: number }> => {
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
    console.warn('Google Sheets API GET notice, using local optimistic cache:', error.message);
  }

  // Combine Google Sheet rows with local submitted bookings (Google Sheet is source of truth)
  const localBookings = getLocalBookings().filter((lb: any) => {
    return !sheetBookings.some((sb: any) => {
      const matchId = sb.bookingId && lb.bookingId && String(sb.bookingId).trim() === String(lb.bookingId).trim();
      const matchSeat = sb.seat && lb.seat && String(sb.seat).trim() === String(lb.seat).trim();
      return matchId || matchSeat;
    });
  });
  const allBookings = [...sheetBookings, ...localBookings];

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  seats.forEach((seat) => {
    // Find all rows matching this seat ID
    const seatBookings = allBookings.filter((b: any) => {
      if (typeof b.seatId === 'number' && b.seatId === seat.id) {
        return true;
      }
      const rawSeat = String(b.seat || b.seatId || b.Seat || '').trim();
      const digits = rawSeat.replace(/\D/g, '');
      return digits.length > 0 && parseInt(digits, 10) === seat.id;
    });

    // Check if any booking row for this seat is currently active
    for (const match of seatBookings) {
      const statusStr = String(match.status || match.Status || '').toLowerCase().trim();
      const expiryStr = String(match.expiry || match.Expiry || '').trim();

      // If status is marked Expired, Cancelled, or Available, skip this booking
      if (statusStr.includes('expire') || statusStr.includes('cancel') || statusStr.includes('availab')) {
        continue;
      }

      // Check if booking membership has expired based on expiry date
      let isExpired = false;
      if (expiryStr) {
        try {
          const expDate = new Date(expiryStr);
          if (!isNaN(expDate.getTime()) && expDate < todayDate) {
            isExpired = true; // Expiry date is in the past -> Seat becomes available
          }
        } catch (e) {
          // Keep active if date parsing fails
        }
      }

      // Seat is occupied if active/paid/confirmed/pending/comfirm AND not expired!
      const isBooked = !isExpired && (
        statusStr.includes('confirm') ||
        statusStr.includes('comfirm') ||
        statusStr.includes('active') ||
        statusStr.includes('paid') ||
        statusStr.includes('booked') ||
        statusStr.includes('pending')
      );

      if (isBooked) {
        seat.status = 'occupied';
        seat.reservedBy = {
          name: match.name || match.Name || 'Booked Member',
          phone: match.phone || match.Phone || '',
        };
        break; // Found active booking for this seat!
      }
    }
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
  const duration = payload.durationMonths || 1;
  const totalAmount = payload.totalAmount || (900 * duration);

  // Calculate Expiry Date (Start Date + duration months)
  const start = new Date(payload.startDate);
  const expiryDateObj = new Date(start);
  expiryDateObj.setMonth(expiryDateObj.getMonth() + duration);
  const expiryDate = expiryDateObj.toISOString().split('T')[0];

  // Generate unique Booking ID (e.g., KRS-8492)
  const bookingId = `KRS-${Math.floor(1000 + Math.random() * 9000)}`;
  const seatName = `Seat #${payload.seatId.toString().padStart(2, '0')}`;
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
    startDate: payload.startDate,
    expiry: expiryDate,
    amount: `₹${totalAmount}`,
    paymentMethod: paymentMethodStr,
    transactionRef: payload.transactionRef || '',
    status: initialStatus,
  };

  // Optimistically save booking locally so the seat IMMEDIATELY turns OCCUPIED!
  saveLocalBooking(postBody);

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
 * Fetch Membership Plans & Packages
 */
export const fetchPlans = async (): Promise<MembershipPlan[]> => {
  return [
    {
      id: 'daily-pass',
      title: '1-Day Access Pass',
      price: 50,
      currency: '₹',
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
      price: 900,
      currency: '₹',
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
      price: 2500,
      currency: '₹',
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
  fetchPlans,
  submitContactApi,
  APPS_SCRIPT_URL,
};
