/**
 * @file BookingModal.tsx
 * @description Modal dialog component for user seat booking.
 * Submits user details (Name, Phone, Email, Start Date, Plan) to Express API using Axios.
 */

'use client';

import React, { useState } from 'react';
import { Seat, bookSeatApi } from '../lib/api';
import { X, Calendar, User, Phone, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BookingModalProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ seat, isOpen, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [planType, setPlanType] = useState('Monthly Full Access (₹900/mo)');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !seat) return null;

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
        email: email.trim(),
        startDate,
        planType,
        notes: notes.trim(),
      });

      setSuccessMessage(res.message || `Seat #${seat.id} reserved successfully!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete seat booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF8F5] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E5E0D5]">
        
        {/* Modal Header */}
        <div className="bg-[#113826] text-white p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
              KEISHAMPAT READING SPACE
            </span>
            <h2 className="text-xl font-extrabold mt-0.5">
              Reserve Seat #{seat.id.toString().padStart(2, '0')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Seat details summary strip */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E5DFD3] flex items-center justify-between text-sm">
            <div>
              <span className="text-xs font-semibold text-[#5C6862] block">Selected Desk</span>
              <span className="font-bold text-[#113826]">{seat.seatNumber} ({seat.type})</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-[#5C6862] block">Monthly Fee</span>
              <span className="font-extrabold text-[#113826]">₹{seat.pricePerMonth} / month</span>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Input: Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6B7771] absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. Joykumar Singh"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Input: Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
              Phone Number (WhatsApp) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#6B7771] absolute left-3 top-3.5" />
              <input
                type="tel"
                required
                placeholder="e.g. 98634 29955"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Input: Email & Start Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7771] absolute left-3 top-3.5" />
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#6B7771] absolute left-3 top-3.5" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-sm outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Membership Plan Choice */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
              Membership Package
            </label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 bg-white text-sm outline-none transition-all"
            >
              <option value="Monthly Full Access (₹900/mo)">Monthly Full Access (₹900 / month)</option>
              <option value="Quarterly Saver Pass (₹2500/3mo)">Quarterly Saver Pass (₹2500 / 3 months)</option>
              <option value="Daily Flex Pass (₹60/day)">Daily Flex Pass (₹60 / day)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#DCD5C8] text-[#3B4641] hover:bg-[#EDE7DD] text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#113826] hover:bg-[#0B2318] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                  <span>Reserving...</span>
                </>
              ) : (
                <span>Confirm Booking</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BookingModal;
