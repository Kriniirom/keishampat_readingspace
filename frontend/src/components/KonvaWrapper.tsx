/**
 * @file KonvaWrapper.tsx
 * @description Dynamic Client-Side Wrapper for KonvaSeatMap component to ensure SSR safety in Next.js App Router.
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Seat } from '../lib/api';

// Loading skeleton while Konva Canvas initializes
const KonvaLoadingFallback = () => (
  <div className="w-full h-[650px] bg-[#FAF7F0] rounded-3xl border-2 border-[#E5DEC3] flex flex-col items-center justify-center space-y-4 p-8 animate-pulse">
    <div className="w-16 h-16 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
    <p className="text-sm font-semibold text-[#113826]">Loading Konva Interactive Graphical Floor Map...</p>
  </div>
);

// Dynamically import KonvaSeatMap with SSR disabled
const KonvaSeatMapDynamic = dynamic(() => import('./KonvaSeatMap'), {
  ssr: false,
  loading: KonvaLoadingFallback,
});

interface KonvaWrapperProps {
  seats: Seat[];
  selectedSeatId: number | null;
  onSelectSeat: (seat: Seat) => void;
}

export const KonvaWrapper: React.FC<KonvaWrapperProps> = (props) => {
  return <KonvaSeatMapDynamic {...props} />;
};

export default KonvaWrapper;
