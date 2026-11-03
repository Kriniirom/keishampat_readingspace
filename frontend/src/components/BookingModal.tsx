/**
 * @file BookingModal.tsx
 * @description Universal Student Admission & Renewal Portal dialog.
 * Fully supports two dedicated workflows:
 * 1. NEW STUDENT: Enter details (Name, Phone, Address, Seat, Start Date) -> Create customer record -> Pay ₹900 -> Active.
 * 2. EXISTING STUDENT: Enter Booking ID / Phone -> System finds existing student -> Show Name, Seat, Current expiry date -> "Renew for next month" -> Pay ₹900 -> Extend expiry by 1 month -> Update booking & Active.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Seat,
  StudentBooking,
  bookSeatApi,
  renewBookingApi,
  searchStudentBooking,
  parseDateRobust,
} from '../lib/api';
import { PRICING } from '../lib/pricing';
import {
  X,
  Calendar,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Banknote,
  QrCode,
  MessageSquare,
  ShieldCheck,
  Clock,
  Sun,
  Moon,
  ChevronDown,
  Search,
  RefreshCw,
  Sparkles,
  ArrowRight,
  UserCheck,
  Layers,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';

type ShiftType = 'morning' | 'evening' | 'fullday' | 'daypass';

// ============================================================================
// UPI PAYMENT CONFIGURATION
// Direct bank/UPI settlement without gateway transaction fees
// ============================================================================
export const UPI_CONFIG = {
  id: 'krinivash-2@oksbi',
  name: 'Irom Krinivash singh',
};

// ============================================================================
// SHIFT AVAILABILITY SWITCHES
// Toggle Morning and Evening shifts ON (true) or OFF (false) anytime here:
// ============================================================================
export const ENABLE_MORNING_SHIFT = false; // Set to true to re-enable Morning Shift (5:00 AM – 1:00 PM)
export const ENABLE_EVENING_SHIFT = false; // Set to true to re-enable Evening Shift (1:00 PM – 10:00 PM)

// Helper to sanitize requested shift against current toggle switches
const resolveShift = (requestedShift?: ShiftType): ShiftType => {
  if (requestedShift === 'morning' && !ENABLE_MORNING_SHIFT) return 'fullday';
  if (requestedShift === 'evening' && !ENABLE_EVENING_SHIFT) return 'fullday';
  return requestedShift || 'fullday';
};

export interface BookingModalProps {
  seat: Seat | null;
  seats?: Seat[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'new' | 'renew';
  initialShift?: ShiftType;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  seat,
  seats = [],
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'new',
  initialShift = 'fullday',
}) => {
  // Modal active tab: 'new' (New Student) | 'renew' (Existing Student)
  const [activeTab, setActiveTab] = useState<'new' | 'renew'>(initialMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- NEW STUDENT STATE ---
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(seat);
  const [shift, setShift] = useState<ShiftType>(resolveShift(initialShift));
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [newTxnRef, setNewTxnRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(UPI_CONFIG.id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState('');
  const [newSuccess, setNewSuccess] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState('');

  // --- EXISTING STUDENT RENEWAL STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<StudentBooking[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentBooking | null>(null);

  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [renewTxnRef, setRenewTxnRef] = useState('');
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewError, setRenewError] = useState('');
  const [renewSuccess, setRenewSuccess] = useState('');
  const [renewedExpiry, setRenewedExpiry] = useState('');

  // Sync initial tab, seat, and shift on prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setSelectedSeat(seat);
      if (initialShift) {
        setShift(resolveShift(initialShift));
      }
      setNewError('');
      setNewSuccess('');
      setCreatedBookingId('');
      setRenewError('');
      setRenewSuccess('');
      setRenewedExpiry('');
    }
  }, [isOpen, initialMode, seat, initialShift]);

  // If no seat was selected, try picking the first available seat from seats list
  useEffect(() => {
    if (!selectedSeat && seats.length > 0) {
      const firstAvail = seats.find((s) => s.status === 'available');
      if (firstAvail) setSelectedSeat(firstAvail);
    }
  }, [selectedSeat, seats]);

  // Auto-detect shifts occupied on selected seat
  const isMorningOccupied = !!selectedSeat?.shiftsOccupied?.morning;
  const isEveningOccupied = !!selectedSeat?.shiftsOccupied?.evening;
  const isFullDayOccupied = isMorningOccupied || isEveningOccupied;

  useEffect(() => {
    if (selectedSeat) {
        if (ENABLE_MORNING_SHIFT && ENABLE_EVENING_SHIFT) {
          if (isMorningOccupied && !isEveningOccupied) {
            setShift('evening');
          } else if (isEveningOccupied && !isMorningOccupied) {
            setShift('morning');
          } else if (!isMorningOccupied && !isEveningOccupied) {
            setShift('fullday');
          }
        } else if (ENABLE_MORNING_SHIFT && !ENABLE_EVENING_SHIFT) {
          if (!isMorningOccupied) {
            setShift('morning');
          } else {
            setShift('fullday');
          }
        } else if (ENABLE_EVENING_SHIFT && !ENABLE_MORNING_SHIFT) {
          if (!isEveningOccupied) {
            setShift('evening');
          } else {
            setShift('fullday');
          }
        } else {
          setShift('fullday');
        }
      }
    }, [selectedSeat, isMorningOccupied, isEveningOccupied]);

  if (!isOpen || !mounted) return null;

  // Formatting helpers
  const formatDateReadable = (dateStr: string): string => {
    try {
      if (!dateStr) return 'N/A';
      const d = parseDateRobust(dateStr);
      if (!d || isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const calculateNewExpiry = (currentExpiryStr: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let baseDate = today;
    if (currentExpiryStr) {
      const parsed = parseDateRobust(currentExpiryStr);
      if (parsed && !isNaN(parsed.getTime())) {
        // If renewed in advance, extend from current expiry
        // If renewed during 7-day grace period, extend from original expiry date
        const graceEnd = new Date(parsed);
        graceEnd.setDate(graceEnd.getDate() + 7);
        if (parsed >= today || today <= graceEnd) {
          baseDate = parsed;
        }
      }
    }

    const nextMonth = new Date(baseDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  };

  const getDaysRemaining = (expiryStr: string): {
    days: number;
    isExpired: boolean;
    inGracePeriod: boolean;
    graceDaysLeft: number;
  } => {
    if (!expiryStr) {
      return { days: 0, isExpired: true, inGracePeriod: false, graceDaysLeft: 0 };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = parseDateRobust(expiryStr);
    if (!exp || isNaN(exp.getTime())) {
      return { days: 0, isExpired: true, inGracePeriod: false, graceDaysLeft: 0 };
    }
    exp.setHours(23, 59, 59, 999);
    const diffMs = exp.getTime() - today.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isPastExpiry = days < 0;
    const inGracePeriod = isPastExpiry && days >= -7;
    const graceDaysLeft = inGracePeriod ? (7 + days) : 0;
    const isExpired = days < -7;
    return { days, isExpired, inGracePeriod, graceDaysLeft };
  };

  // --- NEW STUDENT SUBMIT ---
  const shiftLabelMap: Record<ShiftType, string> = {
    fullday: 'Full Day Access (5:00 AM – 10:00 PM)',
    morning: 'Morning Shift (5:00 AM – 1:00 PM)',
    evening: 'Evening Shift (1:00 PM – 10:00 PM)',
    daypass: '1-Day Access Pass (5:00 AM – 10:00 PM)',
  };

  const isDayPass = shift === 'daypass';
  const isHalfDay = shift === 'morning' || shift === 'evening';
  const newFeeRate = isDayPass
    ? PRICING.DAILY_PASS_FEE
    : (isHalfDay ? PRICING.HALF_DAY_FEE : (selectedSeat?.pricePerMonth || PRICING.MONTHLY_FEE));
  const newTotalAmount = isDayPass ? PRICING.DAILY_PASS_FEE : (newFeeRate * durationMonths);

  const handleNewStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewError('');
    setNewSuccess('');
    setCreatedBookingId('');

    if (!selectedSeat) {
      setNewError('Please select a study desk number.');
      return;
    }

    if (!ENABLE_MORNING_SHIFT && shift === 'morning') {
      setNewError('Morning shift is currently unavailable. Please select Full Day or 1-Day Pass.');
      return;
    }
    if (!ENABLE_EVENING_SHIFT && shift === 'evening') {
      setNewError('Evening shift is currently unavailable. Please select Full Day or 1-Day Pass.');
      return;
    }

    if (shift === 'morning' && isMorningOccupied) {
      setNewError('Morning shift is already occupied for this desk. Please select the Evening shift.');
      return;
    }
    if (shift === 'evening' && isEveningOccupied) {
      setNewError('Evening shift is already occupied for this desk. Please select the Morning shift.');
      return;
    }
    if ((shift === 'fullday' || shift === 'daypass') && isFullDayOccupied) {
      setNewError('Full Day access is unavailable for this desk as one of the shifts is reserved.');
      return;
    }

    if (!fullName.trim() || !phone.trim() || !startDate) {
      setNewError('Please enter Student Name, Phone Number, and Start Date.');
      return;
    }

    try {
      setNewLoading(true);
      const res = await bookSeatApi({
        seatId: selectedSeat.id,
        shift,
        shiftLabel: shiftLabelMap[shift],
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        startDate,
        durationMonths: isDayPass ? 1 : durationMonths,
        totalAmount: newTotalAmount,
        planType: isDayPass
          ? `1-Day Access Pass (${PRICING.CURRENCY}${PRICING.DAILY_PASS_FEE})`
          : `${shiftLabelMap[shift]} (${durationMonths} Mo - ₹${newTotalAmount})`,
        paymentMethod: newPaymentMethod,
        transactionRef: newTxnRef.trim(),
      });

      setCreatedBookingId(res.bookingId || '');
      setNewSuccess(res.message || `Customer record created! Seat #${selectedSeat.id} is now Active.`);
      onSuccess();
    } catch (err: any) {
      setNewError(err.message || 'Failed to create student admission. Please try again.');
    } finally {
      setNewLoading(false);
    }
  };

  // WhatsApp message generator for New Student / Day Pass
  const newStudentWhatsappMsg = encodeURIComponent(
    `Hello Keishampat Reading Space,\nI have submitted a ${isDayPass ? '1-DAY ACCESS PASS' : 'NEW STUDENT'} booking:\n• Name: ${fullName.trim()}\n• Phone: ${phone.trim()}\n• Address: ${address.trim() || 'N/A'}\n• Seat: ${selectedSeat?.seatNumber || 'Desk'}\n• Plan: ${shiftLabelMap[shift]}\n• Date: ${startDate}\n• Fee: ₹${newTotalAmount} (${newPaymentMethod.toUpperCase()}${newTxnRef.trim() ? ` - UTR: ${newTxnRef.trim()}` : (newPaymentMethod === 'upi' ? ' - Screenshot attached' : '')})\n• Booking ID: ${createdBookingId || 'Pending'}\nPlease verify my admission record.`
  );

  // --- EXISTING STUDENT SEARCH ---
  const handleSearchStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchError('Please enter your Booking ID (e.g. KRS-6611) or registered Phone Number.');
      return;
    }

    setSearchError('');
    setSelectedStudent(null);
    setRenewSuccess('');
    setSearching(true);

    try {
      const results = await searchStudentBooking(searchQuery);
      if (results.length === 0) {
        setSearchError(`No student record found for "${searchQuery}". Please check your Booking ID or Phone Number.`);
        setSearchResults([]);
      } else {
        setSearchResults(results);
        setSelectedStudent(results[0]); // Select the most recent record
      }
    } catch (err) {
      setSearchError('Could not search records at this moment. Please check connection or try again.');
    } finally {
      setSearching(false);
    }
  };

  // --- EXISTING STUDENT RENEW SUBMIT ---
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setRenewError('');
    setRenewSuccess('');

    const calculatedExpiry = calculateNewExpiry(selectedStudent.expiry);

    try {
      setRenewLoading(true);
      const res = await renewBookingApi({
        bookingId: selectedStudent.bookingId,
        fullName: selectedStudent.name,
        phone: selectedStudent.phone,
        address: selectedStudent.address,
        seat: selectedStudent.seat,
        seatId: selectedStudent.seatId,
        shift: selectedStudent.shift,
        currentExpiry: selectedStudent.expiry,
        newExpiry: calculatedExpiry,
        amount: PRICING.MONTHLY_FEE,
        paymentMethod: renewPaymentMethod,
        transactionRef: renewTxnRef.trim(),
      });

      setRenewedExpiry(calculatedExpiry);
      setRenewSuccess(
        `Renewal confirmed! Booking ID: ${selectedStudent.bookingId} is extended by 1 month to ${formatDateReadable(calculatedExpiry)}. Status: ACTIVE.`
      );
      onSuccess();
    } catch (err: any) {
      setRenewError(err.message || 'Failed to submit renewal. Please try again.');
    } finally {
      setRenewLoading(false);
    }
  };

  // WhatsApp message generator for Renewal
  const renewStudentWhatsappMsg = encodeURIComponent(
    `Hello Keishampat Reading Space,\nI have submitted my MONTHLY RENEWAL:\n• Booking ID: ${selectedStudent?.bookingId}\n• Name: ${selectedStudent?.name}\n• Seat: ${selectedStudent?.seat}\n• Extended Expiry: ${renewedExpiry || (selectedStudent ? calculateNewExpiry(selectedStudent.expiry) : '')}\n• Amount Paid: ${PRICING.CURRENCY}${PRICING.MONTHLY_FEE} (${renewPaymentMethod.toUpperCase()}${renewTxnRef.trim() ? ` - UTR: ${renewTxnRef.trim()}` : (renewPaymentMethod === 'upi' ? ' - Screenshot attached' : '')})\nPlease verify my renewal.`
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF8F5] rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-[#E5E0D5]">

        {/* Fixed Top Header */}
        <div className="bg-[#113826] text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1b4b34]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-black text-sm">
              KRS
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-widest block">
                KEISHAMPAT READING SPACE
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Student Admission & Renewal Portal
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: NEW STUDENT vs EXISTING STUDENT */}
        <div className="bg-[#EBE5DA] p-1.5 flex items-center space-x-1 border-b border-[#DDD6C8] flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${activeTab === 'new'
              ? 'bg-[#113826] text-white shadow-md'
              : 'text-[#55625B] hover:text-[#113826] hover:bg-[#F2EDE4]'
              }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>NEW STUDENT ({PRICING.CURRENCY}{PRICING.MONTHLY_FEE})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('renew')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${activeTab === 'renew'
              ? 'bg-[#113826] text-white shadow-md'
              : 'text-[#55625B] hover:text-[#113826] hover:bg-[#F2EDE4]'
              }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>EXISTING STUDENT (Renew)</span>
          </button>
        </div>

        {/* --- TAB 1: NEW STUDENT WORKFLOW --- */}
        {activeTab === 'new' && (
          <form onSubmit={handleNewStudentSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="flex-grow overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4 space-y-3.5">

              {/* Progress Flow Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 sm:p-3 flex items-center justify-between text-[11px] sm:text-xs font-bold text-emerald-900 shadow-sm">
                <span className="flex items-center space-x-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Enter Details</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                <span className="flex items-center space-x-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Create Record</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                <span className="flex items-center space-x-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Pay {PRICING.CURRENCY}{PRICING.MONTHLY_FEE}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-white font-extrabold text-[10px] tracking-wider uppercase">
                  ACTIVE
                </span>
              </div>

              {/* Success Banner */}
              {newSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-2.5 animate-fade-in shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-emerald-950 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Admission Confirmed & Active!</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-widest">
                      STATUS: ACTIVE
                    </span>
                  </div>

                  {createdBookingId && (
                    <div className="bg-[#113826] text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-inner">
                      <span className="text-emerald-300 uppercase tracking-wider">BOOKING ID:</span>
                      <span className="font-mono text-base text-amber-300 font-extrabold">{createdBookingId}</span>
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-emerald-900">{newSuccess}</p>

                  <a
                    href={`https://wa.me/919863429955?text=${newStudentWhatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition-all shadow"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Verification on WhatsApp (+91 98634 29955)</span>
                  </a>
                </div>
              )}

              {/* Error Banner */}
              {newError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2.5 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{newError}</span>
                </div>
              )}

              {/* 1. Name */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-[#113826]" />
                  <span>Student Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joykumar Singh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm font-semibold outline-none transition-all"
                />
              </div>

              {/* 2. Phone */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-[#113826]" />
                  <span>Phone Number (WhatsApp) *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98634 29955"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm font-semibold outline-none transition-all"
                />
              </div>

              {/* 3. Address */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#113826]" />
                  <span>Address / Locality *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keishampat Keisham Leikai, Imphal"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm font-semibold outline-none transition-all"
                />
              </div>

              {/* 4. Seat & Start Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Seat Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-[#113826]" />
                    <span>Study Seat *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSeat?.id || ''}
                      onChange={(e) => {
                        const s = seats.find((x) => x.id === Number(e.target.value));
                        if (s) setSelectedSeat(s);
                      }}
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm font-bold text-[#113826] outline-none transition-all appearance-none cursor-pointer pr-8"
                    >
                      {seats.length > 0 ? (
                        seats.map((s) => (
                          <option key={s.id} value={s.id} disabled={s.status === 'occupied'}>
                            {s.seatNumber} ({s.status === 'occupied' ? 'Occupied' : 'Available'})
                          </option>
                        ))
                      ) : (
                        <option value={selectedSeat?.id || 1}>
                          {selectedSeat?.seatNumber || 'Seat #01'}
                        </option>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-[#113826]" />
                    <span>{isDayPass ? 'Booking Date (1-Day Pass) *' : 'Start Date *'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm font-semibold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Shift Selection */}
              <div className="space-y-1 bg-white p-3 rounded-xl border border-[#E5DFD3] shadow-sm">
                <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#113826]" />
                  <span>Select Subscription Shift *</span>
                </label>
                <div className="relative">
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] bg-white text-xs sm:text-sm font-bold text-[#113826] outline-none appearance-none pr-8 cursor-pointer"
                  >
                    <option value="fullday" disabled={isFullDayOccupied}>
                      🌟 Full Day: 5:00 AM – 10:00 PM ({PRICING.CURRENCY}{PRICING.MONTHLY_FEE}/month) {isFullDayOccupied ? '— [Unavailable]' : '— [Standard Plan]'}
                    </option>
                    {ENABLE_MORNING_SHIFT && (
                      <option value="morning" disabled={isMorningOccupied}>
                        🌅 Morning Shift: 5:00 AM – 1:00 PM ({PRICING.CURRENCY}{PRICING.HALF_DAY_FEE}/month) {isMorningOccupied ? '— [Occupied]' : '— [Available]'}
                      </option>
                    )}
                    {ENABLE_EVENING_SHIFT && (
                      <option value="evening" disabled={isEveningOccupied}>
                        🌇 Evening Shift: 1:00 PM – 10:00 PM ({PRICING.CURRENCY}{PRICING.HALF_DAY_FEE}/month) {isEveningOccupied ? '— [Occupied]' : '— [Available]'}
                      </option>
                    )}
                    <option value="daypass" disabled={isFullDayOccupied}>
                      🎟️ 1-Day Pass: 5:00 AM – 10:00 PM ({PRICING.CURRENCY}{PRICING.DAILY_PASS_FEE}/day) {isFullDayOccupied ? '— [Unavailable]' : '— [Available]'}
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Customer Record Preview Card */}
              <div className="p-3.5 rounded-xl bg-[#F4EFE6] border border-[#DDD6C8] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#113826] font-bold">
                  <span className="flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span>Customer Record Preview</span>
                  </span>
                  <span className="font-extrabold text-sm text-[#113826]">₹{newTotalAmount}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#55625B]">
                  <div>
                    <span className="block font-medium">Assigned Desk:</span>
                    <strong className="text-[#1E2421]">{selectedSeat?.seatNumber || 'Desk'} ({shift === 'daypass' ? '1-Day Pass' : shiftLabelMap[shift].split(' ')[0]})</strong>
                  </div>
                  <div>
                    <span className="block font-medium">Fee:</span>
                    <strong className="text-emerald-900">
                      {isDayPass ? `${PRICING.CURRENCY}${PRICING.DAILY_PASS_FEE} / Day` : `${PRICING.CURRENCY}${newFeeRate} / Month`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment Option (Cash vs UPI) */}
              <div className="space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                  Payment Method (Pay ₹{newTotalAmount}) *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-0.5 transition-all ${newPaymentMethod === 'cash'
                      ? 'bg-[#113826] text-white border-[#113826] shadow-md ring-2 ring-[#113826]/30'
                      : 'bg-white text-[#3B4641] border-[#DCD5C8] hover:border-[#113826]'
                      }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-xs font-bold">Cash at Counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-0.5 transition-all ${newPaymentMethod === 'upi'
                      ? 'bg-[#113826] text-white border-[#113826] shadow-md ring-2 ring-[#113826]/30'
                      : 'bg-white text-[#3B4641] border-[#DCD5C8] hover:border-[#113826]'
                      }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-xs font-bold">UPI Payment</span>
                  </button>
                </div>

                {newPaymentMethod === 'upi' && (
                  <div className="p-3.5 rounded-2xl bg-[#F6FAF7] border-2 border-emerald-300 text-emerald-950 space-y-3 text-xs shadow-sm">
                    {/* Header with Amount */}
                    <div className="flex items-center justify-between font-extrabold border-b border-emerald-200 pb-2">
                      <div className="flex items-center space-x-1.5 text-[#113826]">
                        <QrCode className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs uppercase tracking-wider">Fast UPI Payment</span>
                      </div>
                      <span className="text-sm font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                        ₹{newTotalAmount}
                      </span>
                    </div>

                    {/* 1-Click Pay with UPI App (GPay / PhonePe / Paytm / BHIM) */}
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(UPI_CONFIG.id)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${newTotalAmount}&cu=INR&tn=${encodeURIComponent('KRS Admission ' + (selectedSeat?.seatNumber || 'Desk'))}`}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-700 via-[#113826] to-emerald-800 hover:opacity-95 text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98]"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-300 animate-pulse" />
                      <span>Tap to Pay ₹{newTotalAmount} (GPay / PhonePe / Paytm)</span>
                    </a>

                    {/* QR Code + Copy UPI ID Card */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-emerald-200">
                      <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center flex-shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${UPI_CONFIG.id}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${newTotalAmount}&cu=INR&tn=${encodeURIComponent('KRS Admission')}`)}`}
                          alt="Scan to Pay via UPI"
                          width={110}
                          height={110}
                          className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                          loading="lazy"
                        />
                        <span className="text-[9px] font-bold text-gray-500 mt-0.5">Scan to Pay</span>
                      </div>

                      <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                        <div>
                          <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider">
                            UPI ID / VPA
                          </span>
                          <div className="flex items-center justify-center sm:justify-start space-x-1.5 mt-1">
                            <span className="font-mono font-bold text-emerald-950 text-xs bg-emerald-100/70 px-2 py-1 rounded border border-emerald-300 select-all">
                              {UPI_CONFIG.id}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="px-2.5 py-1 rounded-lg bg-[#113826] hover:bg-[#0b2318] text-white text-[11px] font-bold flex items-center space-x-1 transition-all shadow-sm active:scale-95"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug">
                          Payee: <strong className="text-emerald-950">{UPI_CONFIG.name}</strong>
                          <br />
                          <span className="text-[10px] text-gray-500">Scan with Google Pay, PhonePe, Paytm, or BHIM</span>
                        </p>
                      </div>
                    </div>

                    {/* UTR / Ref (Optional) */}
                    <div className="space-y-1 pt-1 border-t border-emerald-200/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-950">
                          12-digit UTR / Ref No. <span className="font-normal text-gray-500">(Optional)</span>
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700">
                          Or send screenshot on WhatsApp
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 429381902812 (Leave blank if you prefer sending screenshot)"
                        value={newTxnRef}
                        onChange={(e) => setNewTxnRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-semibold outline-none focus:border-[#113826] focus:ring-1 focus:ring-[#113826]/20 transition-all placeholder:font-normal placeholder:text-gray-400"
                      />
                    </div>

                    {/* Step Reminder Note */}
                    <div className="text-[10px] text-emerald-900 bg-emerald-100/70 p-2 rounded-xl border border-emerald-200 leading-tight">
                      💡 <strong>After paying in GPay/PhonePe:</strong> Return to this tab and tap <strong>&quot;I Have Paid — Activate Student&quot;</strong> below.
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Submit Footer */}
            <div className="px-4 py-3 sm:px-6 bg-[#F4F0EA] border-t border-[#E5DFD3] flex items-center justify-end space-x-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#DCD5C8] text-[#3B4641] hover:bg-[#EDE7DD] text-xs sm:text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={newLoading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#113826] hover:bg-[#0B2318] text-white text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {newLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                    <span>{isDayPass ? 'Processing 1-Day Pass...' : 'Processing Admission...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isDayPass
                        ? `Pay ₹${newTotalAmount} & Book 1-Day Pass`
                        : (newPaymentMethod === 'upi'
                          ? `I Have Paid ₹${newTotalAmount} — Activate Student`
                          : `Pay ₹${newTotalAmount} & Activate Student`)}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* --- TAB 2: EXISTING STUDENT WORKFLOW (RENEWAL) --- */}
        {activeTab === 'renew' && (
          <div className="flex flex-col flex-grow overflow-hidden">
            <div className="flex-grow overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4 space-y-4">

              {/* Progress Banner for Renewal */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 sm:p-3 flex items-center justify-between text-[11px] sm:text-xs font-bold text-emerald-900 shadow-sm">
                <span className="flex items-center space-x-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Enter ID / Phone</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                <span className="flex items-center space-x-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Find Student</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                <span className="flex items-center space-x-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Renew for {PRICING.CURRENCY}{PRICING.MONTHLY_FEE}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-white font-extrabold text-[10px] tracking-wider uppercase">
                  +1 MO
                </span>
              </div>

              {/* Step 1: Search Form */}
              <form onSubmit={handleSearchStudent} className="space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                  Enter Booking ID or Phone Number *
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <Search className="w-4 h-4 text-[#6B7771] absolute left-3 top-2.5 sm:top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. KRS-6611 or 9863429955"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm font-semibold outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-4 py-2 sm:py-2.5 rounded-xl bg-[#113826] hover:bg-[#0B2318] text-white text-xs sm:text-sm font-extrabold shadow transition-all flex items-center space-x-1.5 flex-shrink-0 disabled:opacity-50"
                  >
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                    ) : (
                      <Search className="w-4 h-4 text-emerald-300" />
                    )}
                    <span>Find Student</span>
                  </button>
                </div>
              </form>

              {/* Search Error Alert */}
              {searchError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2.5 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Renewal Success Banner */}
              {renewSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-2.5 animate-fade-in shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-emerald-950 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Membership Renewed Successfully!</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-widest">
                      STATUS: ACTIVE
                    </span>
                  </div>

                  <div className="bg-[#113826] text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-300 uppercase">NEW EXPIRY DATE:</span>
                    <span className="font-mono text-base text-amber-300 font-extrabold">
                      {formatDateReadable(renewedExpiry)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-emerald-900">{renewSuccess}</p>

                  <a
                    href={`https://wa.me/919863429955?text=${renewStudentWhatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition-all shadow"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Renewal Receipt on WhatsApp (+91 98634 29955)</span>
                  </a>
                </div>
              )}

              {/* Step 2: System Finds Existing Student -> Show Details */}
              {selectedStudent && (
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#113826]/20 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0EADF] pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#113826] flex items-center justify-center font-black text-xs">
                        ID
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                          BOOKING ID
                        </span>
                        <span className="font-mono text-sm font-extrabold text-[#113826]">
                          {selectedStudent.bookingId}
                        </span>
                      </div>
                    </div>

                    {/* Expiry / Active Status Badge */}
                    {(() => {
                      const { days, isExpired, inGracePeriod, graceDaysLeft } = getDaysRemaining(selectedStudent.expiry);
                      if (inGracePeriod) {
                        return (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider border border-amber-300 animate-pulse">
                            ⚠️ 7-Day Grace: {graceDaysLeft} {graceDaysLeft === 1 ? 'Day' : 'Days'} Left
                          </span>
                        );
                      }
                      if (isExpired) {
                        return (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] uppercase tracking-wider border border-rose-200">
                            Expired
                          </span>
                        );
                      }
                      if (days <= 5) {
                        return (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider border border-amber-200">
                            Expires in {days} Days
                          </span>
                        );
                      }
                      return (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200">
                          Active · {days} Days Left
                        </span>
                      );
                    })()}
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE5DA]">
                      <span className="text-[10px] font-semibold text-gray-500 block">Student Name</span>
                      <strong className="text-sm font-bold text-[#113826]">{selectedStudent.name}</strong>
                    </div>

                    <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE5DA]">
                      <span className="text-[10px] font-semibold text-gray-500 block">Assigned Seat</span>
                      <strong className="text-sm font-bold text-[#113826]">{selectedStudent.seat}</strong>
                    </div>

                    <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE5DA]">
                      <span className="text-[10px] font-semibold text-gray-500 block">Registered Phone</span>
                      <strong className="text-xs font-bold text-gray-800">{selectedStudent.phone}</strong>
                    </div>

                    <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE5DA]">
                      <span className="text-[10px] font-semibold text-gray-500 block">Current Expiry Date</span>
                      <strong className="text-xs font-bold text-[#113826]">
                        {formatDateReadable(selectedStudent.expiry)}
                      </strong>
                    </div>
                  </div>

                  {/* 7-Day Grace Period Alert */}
                  {(() => {
                    const { inGracePeriod, graceDaysLeft } = getDaysRemaining(selectedStudent.expiry);
                    if (!inGracePeriod) return null;
                    const exp = parseDateRobust(selectedStudent.expiry);
                    const deadline = exp ? new Date(exp.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
                    const deadlineStr = deadline ? formatDateReadable(deadline.toISOString().split('T')[0]) : '7 days';

                    return (
                      <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-1 text-xs">
                        <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>7-Day Renewal Warning Period Active</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-900">
                          Your monthly subscription expired on <strong>{formatDateReadable(selectedStudent.expiry)}</strong>. Your desk is kept reserved for you during this 7-day grace period until <strong>{deadlineStr}</strong> ({graceDaysLeft} {graceDaysLeft === 1 ? 'day' : 'days'} remaining). Please renew before the deadline to keep your desk.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Multiple records selector if user has multiple bookings under same phone */}
                  {searchResults.length > 1 && (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        Multiple Bookings Found ({searchResults.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {searchResults.map((b) => (
                          <button
                            key={b.bookingId}
                            type="button"
                            onClick={() => setSelectedStudent(b)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${selectedStudent.bookingId === b.bookingId
                              ? 'bg-[#113826] text-white'
                              : 'bg-[#EBE5DA] text-gray-700 hover:bg-[#DDD6C8]'
                              }`}
                          >
                            {b.bookingId} ({b.seat})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Renew for Next Month Action Card */}
                  <form onSubmit={handleRenewSubmit} className="space-y-3.5 pt-2 border-t border-[#F0EADF]">
                    <div className="bg-[#EDE7DD]/70 p-3 rounded-xl border border-[#DDD6C8] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-[#55625B] block">Validity Extension</span>
                        <div className="flex items-center space-x-1.5 font-bold text-[#113826] text-xs sm:text-sm">
                          <span>{formatDateReadable(selectedStudent.expiry)}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-emerald-800 font-extrabold">
                            {formatDateReadable(calculateNewExpiry(selectedStudent.expiry))}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-[#55625B] block">Renewal Fee</span>
                        <span className="font-black text-base sm:text-lg text-[#113826]">{PRICING.CURRENCY}{PRICING.MONTHLY_FEE}</span>
                      </div>
                    </div>

                    {/* Payment Mode Selector for Renewal */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                        Payment Option ({PRICING.CURRENCY}{PRICING.MONTHLY_FEE}) *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRenewPaymentMethod('cash')}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-0.5 transition-all ${renewPaymentMethod === 'cash'
                            ? 'bg-[#113826] text-white border-[#113826] shadow-md ring-2 ring-[#113826]/30'
                            : 'bg-white text-[#3B4641] border-[#DCD5C8] hover:border-[#113826]'
                            }`}
                        >
                          <Banknote className="w-4 h-4" />
                          <span className="text-xs font-bold">Cash at Counter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRenewPaymentMethod('upi')}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-0.5 transition-all ${renewPaymentMethod === 'upi'
                            ? 'bg-[#113826] text-white border-[#113826] shadow-md ring-2 ring-[#113826]/30'
                            : 'bg-white text-[#3B4641] border-[#DCD5C8] hover:border-[#113826]'
                            }`}
                        >
                          <QrCode className="w-4 h-4" />
                          <span className="text-xs font-bold">UPI Payment</span>
                        </button>
                      </div>

                      {renewPaymentMethod === 'upi' && (
                        <div className="p-3.5 rounded-2xl bg-[#F6FAF7] border-2 border-emerald-300 text-emerald-950 space-y-3 text-xs shadow-sm">
                          {/* Header with Amount */}
                          <div className="flex items-center justify-between font-extrabold border-b border-emerald-200 pb-2">
                            <div className="flex items-center space-x-1.5 text-[#113826]">
                              <QrCode className="w-4 h-4 text-emerald-700" />
                              <span className="text-xs uppercase tracking-wider">Fast UPI Renewal</span>
                            </div>
                            <span className="text-sm font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                              {PRICING.CURRENCY}{PRICING.MONTHLY_FEE}
                            </span>
                          </div>

                          {/* 1-Click Pay with UPI App */}
                          <a
                            href={`upi://pay?pa=${encodeURIComponent(UPI_CONFIG.id)}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${PRICING.MONTHLY_FEE}&cu=INR&tn=${encodeURIComponent('KRS Renewal ' + (selectedStudent?.bookingId || ''))}`}
                            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-700 via-[#113826] to-emerald-800 hover:opacity-95 text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98]"
                          >
                            <Smartphone className="w-4 h-4 text-emerald-300 animate-pulse" />
                            <span>Tap to Pay {PRICING.CURRENCY}{PRICING.MONTHLY_FEE} (GPay / PhonePe / Paytm)</span>
                          </a>

                          {/* QR Code + Copy UPI ID Card */}
                          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-emerald-200">
                            <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center flex-shrink-0">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${UPI_CONFIG.id}&pn=${encodeURIComponent(UPI_CONFIG.name)}&am=${PRICING.MONTHLY_FEE}&cu=INR&tn=${encodeURIComponent('KRS Renewal ' + (selectedStudent?.bookingId || ''))}`)}`}
                                alt="Scan to Pay via UPI"
                                width={110}
                                height={110}
                                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                                loading="lazy"
                              />
                              <span className="text-[9px] font-bold text-gray-500 mt-0.5">Scan to Pay</span>
                            </div>

                            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                              <div>
                                <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider">
                                  UPI ID / VPA
                                </span>
                                <div className="flex items-center justify-center sm:justify-start space-x-1.5 mt-1">
                                  <span className="font-mono font-bold text-emerald-950 text-xs bg-emerald-100/70 px-2 py-1 rounded border border-emerald-300 select-all">
                                    {UPI_CONFIG.id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleCopyUpi}
                                    className="px-2.5 py-1 rounded-lg bg-[#113826] hover:bg-[#0b2318] text-white text-[11px] font-bold flex items-center space-x-1 transition-all shadow-sm active:scale-95"
                                    title="Copy UPI ID"
                                  >
                                    {copiedUpi ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-gray-600 leading-snug">
                                Payee: <strong className="text-emerald-950">{UPI_CONFIG.name}</strong>
                                <br />
                                <span className="text-[10px] text-gray-500">Scan with Google Pay, PhonePe, Paytm, or BHIM</span>
                              </p>
                            </div>
                          </div>

                          {/* UTR / Ref (Optional) */}
                          <div className="space-y-1 pt-1 border-t border-emerald-200/60">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-emerald-950">
                                12-digit UTR / Ref No. <span className="font-normal text-gray-500">(Optional)</span>
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-700">
                                Or send screenshot on WhatsApp
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. 429381902812 (Leave blank if you prefer sending screenshot)"
                              value={renewTxnRef}
                              onChange={(e) => setRenewTxnRef(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-semibold outline-none focus:border-[#113826] focus:ring-1 focus:ring-[#113826]/20 transition-all placeholder:font-normal placeholder:text-gray-400"
                            />
                          </div>

                          {/* Step Reminder Note */}
                          <div className="text-[10px] text-emerald-900 bg-emerald-100/70 p-2 rounded-xl border border-emerald-200 leading-tight">
                            💡 <strong>After paying in GPay/PhonePe:</strong> Return to this tab and tap <strong>&quot;I Have Paid — Confirm Renewal&quot;</strong> below.
                          </div>
                        </div>
                      )}
                    </div>

                    {renewError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2 text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{renewError}</span>
                      </div>
                    )}

                    {/* Step 4 & 5: Action Button */}
                    <button
                      type="submit"
                      disabled={renewLoading}
                      className="w-full py-3 rounded-xl bg-[#113826] hover:bg-[#0B2318] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {renewLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                          <span>Updating Booking & Extending Expiry...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 text-emerald-300" />
                          <span>
                            {renewPaymentMethod === 'upi'
                              ? `I Have Paid — Confirm Renewal (+1 Month)`
                              : `Renew for next month (Pay ${PRICING.CURRENCY}${PRICING.MONTHLY_FEE})`}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Helpful hint when nothing is searched yet */}
              {!selectedStudent && !searching && (
                <div className="text-center py-6 px-4 space-y-2 text-[#55625B]">
                  <RefreshCw className="w-8 h-8 mx-auto text-[#113826]/40 animate-pulse" />
                  <p className="text-xs font-medium">
                    Enter your KRS Booking ID (e.g. <strong>KRS-6611</strong>) or your 10-digit mobile number above to look up your existing student record and renew with 1 click.
                  </p>
                </div>
              )}

            </div>

            {/* Existing Student Footer */}
            <div className="px-4 py-3 sm:px-6 bg-[#F4F0EA] border-t border-[#E5DFD3] flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-[#55625B] font-medium">
                Need help? Call / WhatsApp <strong>98634 29955</strong>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#DCD5C8] text-[#3B4641] hover:bg-[#EDE7DD] text-xs sm:text-sm font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

export default BookingModal;
