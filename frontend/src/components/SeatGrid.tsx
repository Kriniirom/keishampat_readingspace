/**
 * @file SeatGrid.tsx
 * @description Visual 20-Seat Layout Grid component allowing users to view available and occupied seats,
 * inspect desk features, and select a seat to trigger reservation workflow.
 */

'use client';

import React from 'react';
import { Seat } from '../lib/api';
import { PRICING } from '../lib/pricing';
import { Zap, Lamp, CheckCircle, Lock } from 'lucide-react';

interface SeatGridProps {
  seats: Seat[];
  selectedSeatId: number | null;
  onSelectSeat: (seat: Seat) => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({ seats, selectedSeatId, onSelectSeat }) => {
  const rawSeats: Seat[] = seats && seats.length > 0 ? seats : Array.from({ length: 18 }, (_, index) => {
    const id = index + 1;
    return {
      id,
      seatNumber: `Seat #${id.toString().padStart(2, '0')}`,
      status: 'unknown' as const,
      type: id <= 9 ? 'Standard Desk' : 'Premium Quiet Zone Desk',
      pricePerMonth: PRICING.MONTHLY_FEE,
      hasPowerSocket: true,
      hasDeskLamp: true,
      shiftsOccupied: {
        morning: false,
        evening: false,
        fullDay: false,
      },
    };
  });
  const activeSeats = rawSeats.filter((seat) => seat.id <= 18);
  const availabilityKnown = seats.length > 0;
  return (
    <div className="space-y-6">
      {/* Legend & Seat Count Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F2EDE4] p-4 rounded-xl border border-[#E4DDD0]">
        <div className="flex items-center space-x-6">
          {!availabilityKnown ? <span className="flex items-center gap-2 text-sm"><span className="w-4 h-4 rounded-md bg-slate-100 border border-slate-400" />Availability unknown</span> : <>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-md bg-emerald-600 border border-emerald-700" />
            <span className="text-sm font-semibold text-[#2C3531]">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-md bg-amber-500 border border-amber-600" />
            <span className="text-sm font-semibold text-[#2C3531]">Pending / Confirm</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-md bg-[#113826] border border-[#0B2318]" />
            <span className="text-sm font-semibold text-[#2C3531]">Selected</span>
          </div>
          </>}
        </div>

        <div className="text-sm font-bold text-[#113826]">
          {availabilityKnown ? `Capacity: ${activeSeats.filter((s) => s.status === 'available').length} / ${activeSeats.length} Seats Available` : '18 desks — layout preview only'}
        </div>
      </div>

      {/* 20 Study Cubicles Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {activeSeats.map((seat) => {
          const isSelected = availabilityKnown && selectedSeatId === seat.id;
          const isUnknown = seat.status === 'unknown';
          const isOccupied = seat.status === 'occupied';

          let buttonStyle = 'bg-emerald-50 border-emerald-600 text-[#1E2421] hover:border-[#113826] hover:shadow-md';
          if (isUnknown) {
            buttonStyle = 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed';
          } else if (isOccupied) {
            buttonStyle = 'bg-amber-50/80 border-amber-200 text-amber-900 cursor-not-allowed opacity-80';
          } else if (isSelected) {
            buttonStyle = 'bg-[#113826] border-[#0B2318] text-white ring-2 ring-[#113826] shadow-lg scale-105';
          }

          return (
            <button
              key={seat.id}
              disabled={seat.status !== 'available'}
              onClick={() => seat.status === 'available' && onSelectSeat(seat)}
              className={`relative p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[110px] ${buttonStyle}`}
            >
              {/* Top Badge: Seat Number */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-[#55625B]'}`}>
                  #{seat.id.toString().padStart(2, '0')}
                </span>
                {isOccupied ? (
                  seat.isInGracePeriod ? (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300"
                      title={`7-Day Warning Period: ${seat.graceDaysRemaining}d remaining for current student`}
                    >
                      Grace {seat.graceDaysRemaining}d
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                  )
                ) : isSelected ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : seat.shiftsOccupied?.morning && !seat.shiftsOccupied?.evening ? (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200" title="Morning occupied, Evening shift available">
                    Eve Free
                  </span>
                ) : seat.shiftsOccupied?.evening && !seat.shiftsOccupied?.morning ? (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200" title="Evening occupied, Morning shift available">
                    Morn Free
                  </span>
                ) : null}
              </div>

              {/* Study Desk Icon & Label */}
              <div className="my-1.5 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? 'bg-emerald-800 text-white'
                    : isOccupied
                    ? 'bg-amber-200/60 text-amber-800'
                    : (seat.shiftsOccupied?.morning || seat.shiftsOccupied?.evening)
                    ? 'bg-amber-100 text-[#113826] border border-amber-300'
                    : 'bg-[#EAE4D8] text-[#113826]'
                }`}>
                  <span className="font-extrabold text-xs">DESK</span>
                </div>
                <span className="text-xs font-semibold mt-1">
                  {isUnknown ? 'Unknown' : isOccupied
                    ? (seat.isPending ? 'Pending' : seat.isInGracePeriod ? 'Reserved' : 'Confirm')
                    : seat.shiftsOccupied?.morning && !seat.shiftsOccupied?.evening
                    ? 'Eve Available'
                    : seat.shiftsOccupied?.evening && !seat.shiftsOccupied?.morning
                    ? 'Morn Available'
                    : 'Seat ' + seat.id}
                </span>
              </div>

              {/* Amenities Mini Indicators */}
              <div className="flex items-center space-x-1.5 text-[10px] pt-1">
                <span title="Power Socket"><Zap className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-[#727D77]'}`} /></span>
                <span title="Desk Lamp"><Lamp className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-[#727D77]'}`} /></span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SeatGrid;
