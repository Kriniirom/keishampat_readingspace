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
import { Sparkles, RefreshCw, Map, LayoutGrid } from 'lucide-react';

export default function BookPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('grid');

  const loadSeats = async () => {
    try {
      setLoading(true);
      const data = await fetchSeats();
      setSeats(data.seats);
    } catch (err) {
      console.error('Error fetching seats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default to Konva Floor Plan on desktop (width >= 768), Grid View on mobile for zero lag
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setViewMode('canvas');
    }
    loadSeats();
  }, []);

  const handleSelectSeat = (seat: Seat) => {
    setSelectedSeat(seat);
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
                <span>2D Room Layout</span>
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadSeats}
      />
    </div>
  );
}
