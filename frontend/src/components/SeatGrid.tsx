/**
 * @file SeatGrid.tsx
 * @description Visual 20-Seat Layout Grid component allowing users to view available and occupied seats,
 * inspect desk features, and select a seat to trigger reservation workflow.
 */

'use client';

import React from 'react';
import { Seat } from '../lib/api';
import { Zap, Lamp, CheckCircle, Lock } from 'lucide-react';

interface SeatGridProps {
  seats: Seat[];
  selectedSeatId: number | null;
  onSelectSeat: (seat: Seat) => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({ seats, selectedSeatId, onSelectSeat }) => {
  const rawSeats = seats && seats.length > 0 ? seats : Array.from({ length: 18 }, (_, index) => {
    const id = index + 1;
    const isOccupied = id === 3 || id === 7 || id === 12;
    return {
      id,
      seatNumber: `Seat #${id.toString().padStart(2, '0')}`,
      status: isOccupied ? ('occupied' as const) : ('available' as const),
      type: id <= 9 ? 'Standard Desk' : 'Premium Quiet Zone Desk',
      pricePerMonth: 900,
      hasPowerSocket: true,
      hasDeskLamp: true,
    };
  });
  const activeSeats = rawSeats.filter((seat) => seat.id <= 18);
  return (
    <div className="space-y-6">
      {/* Legend & Seat Count Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F2EDE4] p-4 rounded-xl border border-[#E4DDD0]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-md bg-emerald-600 border border-emerald-700" />
            <span className="text-sm font-semibold text-[#2C3531]">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-md bg-amber-500 border border-amber-600" />
            <span className="text-sm font-semibold text-[#2C3531]">Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-md bg-[#113826] border border-[#0B2318]" />
            <span className="text-sm font-semibold text-[#2C3531]">Selected</span>
          </div>
        </div>

        <div className="text-sm font-bold text-[#113826]">
          Capacity: {activeSeats.filter((s) => s.status === 'available').length} / {activeSeats.length} Seats Available
        </div>
      </div>

      {/* 20 Study Cubicles Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {activeSeats.map((seat) => {
          const isSelected = selectedSeatId === seat.id;
          const isOccupied = seat.status === 'occupied';

          let buttonStyle = 'bg-white border-[#DCD5C8] text-[#1E2421] hover:border-[#113826] hover:shadow-md';
          if (isOccupied) {
            buttonStyle = 'bg-amber-50/80 border-amber-200 text-amber-900 cursor-not-allowed opacity-80';
          } else if (isSelected) {
            buttonStyle = 'bg-[#113826] border-[#0B2318] text-white ring-2 ring-[#113826] shadow-lg scale-105';
          }

          return (
            <button
              key={seat.id}
              disabled={isOccupied}
              onClick={() => !isOccupied && onSelectSeat(seat)}
              className={`relative p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[110px] ${buttonStyle}`}
            >
              {/* Top Badge: Seat Number */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-[#55625B]'}`}>
                  #{seat.id.toString().padStart(2, '0')}
                </span>
                {isOccupied ? (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                ) : isSelected ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : null}
              </div>

              {/* Study Desk Icon & Label */}
              <div className="my-1.5 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-emerald-800 text-white' : isOccupied ? 'bg-amber-200/60 text-amber-800' : 'bg-[#EAE4D8] text-[#113826]'
                }`}>
                  <span className="font-extrabold text-xs">DESK</span>
                </div>
                <span className="text-xs font-semibold mt-1">
                  {isOccupied ? 'Occupied' : 'Seat ' + seat.id}
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
