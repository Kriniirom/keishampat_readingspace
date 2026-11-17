/**
 * @file page.tsx (Book Seat Route)
 * @description Dedicated Seat Booking System page route with Konva HTML5 Canvas Graphical Floor Plan
 * matching the user's reading room architecture. Provides seamless toggle between Konva Floor Plan & Grid View.
 */

'use client';

import React, { useEffect, useState } from 'react';
import KonvaWrapper from '../../components/KonvaWrapper';
import SeatGrid from '../../components/SeatGrid';
import BookingModal from '../../components/BookingModal';
import { Seat, fetchSeats } from '../../lib/api';
import { PRICING } from '../../lib/pricing';
import { Sparkles, RefreshCw, Map, LayoutGrid, Ticket } from 'lucide-react';

export default function BookPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'new' | 'renew'>('new');
  const [modalShift, setModalShift] = useState<'morning' | 'evening' | 'fullday' | 'daypass'>('fullday');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');

  const loadSeats = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await fetchSeats();
      setSeats(data.seats);
    } catch (err: any) {
      setSeats([]);
      setLoadError(err.message || 'Unable to load availability. Please refresh.');
      console.error('Error fetching seats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeats();
    // Other customers may reserve a seat while this page is open.
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadSeats();
    }, 15000);
    const refreshOnFocus = () => { loadSeats(); };
    window.addEventListener('focus', refreshOnFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refreshOnFocus); };
  }, []);

  const handleSelectSeat = (seat: Seat) => {
    if (seat.status !== 'available') return;
    setSelectedSeat(seat);
    setModalMode('new');
    setModalShift('fullday');
    setIsModalOpen(true);
  };

  const handleOpenRenew = () => {
    setModalMode('renew');
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setModalMode('new');
    setModalShift('fullday');
    setIsModalOpen(true);
  };

  const handleOpenDayPass = () => {
    setModalMode('new');
    setModalShift('daypass');
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#113826] uppercase tracking-widest bg-[#EDE7DD] px-4 py-1.5 rounded-full border border-[#DDD6C8]">
          18 DEDICATED STUDY CUBICLES
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#113826] tracking-tight">
          Reserve Your Desk Online
        </h1>
        <p className="text-base sm:text-lg text-[#55625B] font-medium leading-relaxed">
          Select your preferred cubicle from our interactive 2D graphical room map below to start your monthly subscription.
        </p>

        {/* Quick Portal Switcher Banner */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleOpenNew}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#113826] hover:bg-[#0B2318] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>New Student Admission ({PRICING.CURRENCY}{PRICING.MONTHLY_FEE})</span>
          </button>

          <button
            onClick={handleOpenDayPass}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm border border-amber-300 shadow-sm transition-all active:scale-95"
          >
            <Ticket className="w-4 h-4 text-amber-600" />
            <span>1-Day Pass ({PRICING.CURRENCY}{PRICING.DAILY_PASS_FEE})</span>
          </button>

          <button
            onClick={handleOpenRenew}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#EDE7DD] hover:bg-[#DDD6C8] text-[#113826] font-bold text-xs sm:text-sm border border-[#CFC5B4] shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-emerald-700" />
            <span>Check Booking Status / Renew</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-[#EBE5DA] space-y-6">

        {/* Header Controls: View Toggle & Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F0EADF]">
          <div className="flex items-center space-x-2 text-sm font-bold text-[#113826]">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Reading Room Layout Map</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Switcher Tabs */}
            <div className="flex bg-[#F2EDE4] p-1 rounded-xl border border-[#E2DBD0]">
              <button
                onClick={() => setViewMode('canvas')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'canvas'
                  ? 'bg-[#113826] text-white shadow-sm'
                  : 'text-[#55625B] hover:text-[#113826]'
                  }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>2D Layout</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid'
                  ? 'bg-[#113826] text-white shadow-sm'
                  : 'text-[#55625B] hover:text-[#113826]'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadSeats}
              className="flex items-center space-x-2 text-xs font-semibold text-[#55625B] hover:text-[#113826] bg-[#F2EDE4] px-3.5 py-2 rounded-xl border border-[#E2DBD0] transition-all hover:bg-[#EAE3D6]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {loadError && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-900">{loadError}</p>}
        {/* View Component Render */}
        {viewMode === 'canvas' ? (
          <KonvaWrapper
            seats={seats}
            selectedSeatId={selectedSeat?.id || null}
            onSelectSeat={handleSelectSeat}
          />
        ) : (
          <SeatGrid
            seats={seats}
            selectedSeatId={selectedSeat?.id || null}
            onSelectSeat={handleSelectSeat}
          />
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        seat={selectedSeat}
        seats={seats}
        isOpen={isModalOpen}
        initialMode={modalMode}
        initialShift={modalShift}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadSeats}
      />
    </div>
  );
}
