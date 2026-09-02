/**
 * @file BookingModal.tsx
 * @description Highly mobile-responsive modal dialog for seat booking with Address input,
 * Month Selection, UPI & Cash Payment options.
 */

'use client';

import React, { useState } from 'react';
import { Seat, bookSeatApi } from '../lib/api';
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
} from 'lucide-react';

interface BookingModalProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ seat, isOpen, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !seat) return null;

  const monthlyPrice = seat.pricePerMonth || 900;
  const totalAmount = monthlyPrice * durationMonths;

  const whatsappMessage = encodeURIComponent(
    `Hello Keishampat Reading Space, I am submitting a Cash Payment of ₹${totalAmount} for ${seat.seatNumber} (${durationMonths} Month${durationMonths > 1 ? 's' : ''}, Student Name: ${fullName || 'Student'}, Phone: ${phone || 'N/A'}, Address: ${address || 'N/A'}). Please verify my cash payment.`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim() || !phone.trim() || !startDate) {
      setErrorMessage('Please fill in your full name, phone number, and preferred start date.');
      return;
    }

    try {
      setLoading(true);
      const res = await bookSeatApi({
        seatId: seat.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        startDate,
        durationMonths,
        totalAmount,
        planType: `${durationMonths} Month${durationMonths > 1 ? 's' : ''} Access (₹${totalAmount})`,
        paymentMethod,
        transactionRef: transactionRef.trim(),
        notes: notes.trim(),
      });

      setSuccessMessage(res.message || `Seat #${seat.id} reserved successfully!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete seat booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FAF8F5] rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-[#E5E0D5]">
        
        {/* Fixed Header */}
        <div className="bg-[#113826] text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-widest block">
              KEISHAMPAT READING SPACE
            </span>
            <h2 className="text-base sm:text-xl font-extrabold mt-0.5">
              Reserve Seat #{seat.id.toString().padStart(2, '0')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          
          <div className="flex-grow overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4 space-y-3">
            
            {/* Desk Summary & Calculated Fee Strip */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E5DFD3] flex items-center justify-between text-xs sm:text-sm shadow-sm">
              <div>
                <span className="text-[10px] sm:text-xs font-semibold text-[#5C6862] block">Selected Desk</span>
                <span className="font-bold text-[#113826]">{seat.seatNumber} ({seat.type})</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] sm:text-xs font-semibold text-[#5C6862] block">
                  Total Fee ({durationMonths} Mo)
                </span>
                <span className="font-extrabold text-base sm:text-lg text-[#113826]">₹{totalAmount}</span>
              </div>
            </div>

            {/* Success Banner */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 space-y-2 text-xs sm:text-sm">
                <div className="flex items-center space-x-2 font-bold text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Booking Submitted Successfully!</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-800">{successMessage}</p>
                {paymentMethod === 'cash' && (
                  <a
                    href={`https://wa.me/919863429955?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm mt-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Verify via WhatsApp (+91 98634 29955)</span>
                  </a>
                )}
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2.5 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6B7771] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Joykumar Singh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                Phone Number (WhatsApp) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6B7771] absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98634 29955"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Home Address / Location */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                Home Address / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#6B7771] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Keishampat Keisham Leikai"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs sm:text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Start Date & Duration Grid (2 Columns on mobile for compact height) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#6B7771] absolute left-2.5 top-2.5" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                  Duration *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#6B7771] absolute left-2.5 top-2.5" />
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-2 sm:py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-xs font-semibold outline-none transition-all"
                  >
                    <option value={1}>1 Month (₹{monthlyPrice * 1})</option>
                    <option value={2}>2 Months (₹{monthlyPrice * 2})</option>
                    <option value={3}>3 Months (₹{monthlyPrice * 3})</option>
                    <option value={6}>6 Months (₹{monthlyPrice * 6})</option>
                    <option value={12}>12 Months (₹{monthlyPrice * 12})</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method Selector (Cash vs UPI) */}
            <div className="space-y-1.5 pt-0.5">
              <label className="text-[10px] sm:text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                Payment Option *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center space-y-0.5 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-[#113826] text-white border-[#113826] shadow-md ring-2 ring-[#113826]/30'
                      : 'bg-white text-[#3B4641] border-[#DCD5C8] hover:border-[#113826]'
                  }`}
                >
                  <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[11px] sm:text-xs font-bold">Cash at Counter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center space-y-0.5 transition-all ${
                    paymentMethod === 'upi'
                      ? 'bg-[#113826] text-white border-[#113826] shadow-md ring-2 ring-[#113826]/30'
                      : 'bg-white text-[#3B4641] border-[#DCD5C8] hover:border-[#113826]'
                  }`}
                >
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[11px] sm:text-xs font-bold">UPI Payment</span>
                </button>
              </div>
            </div>

            {/* CASH OPTION NOTICE & INSTRUCTIONS */}
            {paymentMethod === 'cash' && (
              <div className="p-3 sm:p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 text-amber-900 space-y-2 animate-fade-in shadow-sm">
                <div className="flex items-center space-x-1.5 font-extrabold text-amber-950 text-[10px] sm:text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Cash Payment Verification Required</span>
                </div>
                <p className="text-[11px] sm:text-xs font-semibold leading-relaxed text-amber-900">
                  ⚠️ <strong>Notice:</strong> After paying <strong>₹{totalAmount}</strong> for <strong>{durationMonths} Month{durationMonths > 1 ? 's' : ''}</strong>, please <strong>inform the reception counter in person</strong> OR <strong>send a message on WhatsApp (+91 98634 29955)</strong> for instant verification!
                </p>
                <a
                  href={`https://wa.me/919863429955?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Verify via WhatsApp (+91 98634 29955)</span>
                </a>
              </div>
            )}

            {/* UPI OPTION DETAILS */}
            {paymentMethod === 'upi' && (
              <div className="p-3 sm:p-4 rounded-xl bg-emerald-50/90 border-2 border-emerald-200 text-emerald-900 space-y-2.5 animate-fade-in shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-950">UPI ID: keishampatreading@upi</span>
                  <span className="text-emerald-700 font-extrabold">₹{totalAmount}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-emerald-800">
                  Pay ₹{totalAmount} for {durationMonths} month{durationMonths > 1 ? 's' : ''} via GPay, PhonePe, or Paytm to <strong>9863429955</strong>.
                </p>
                <div>
                  <label className="text-[10px] font-bold text-emerald-950 block mb-1">
                    UPI Transaction ID / UTR (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 423985109283"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Sticky Modal Action Footer */}
          <div className="px-4 py-3 sm:px-6 bg-[#F4F0EA] border-t border-[#E5DFD3] flex items-center justify-end space-x-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-[#DCD5C8] text-[#3B4641] hover:bg-[#EDE7DD] text-xs sm:text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#113826] hover:bg-[#0B2318] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Confirm {paymentMethod === 'cash' ? 'Cash' : 'UPI'} Booking (₹{totalAmount})</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BookingModal;
