/**
 * @file KonvaSeatMap.tsx
 * @description HTML5 Canvas Graphical Floor Plan for Seat Reservation using Konva (react-konva).
 * Uses static Konva node trees with `visible` props instead of boolean short-circuiting
 * to prevent ReactKonvaHostConfig reconciliation errors (`parentInstance.add is not a function`).
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Group, Rect, Circle, Line, Arc, Text } from 'react-konva';
import { Seat } from '../lib/api';
import { ZoomIn, ZoomOut, RotateCcw, Hand, Sparkles } from 'lucide-react';

interface KonvaSeatMapProps {
  seats: Seat[];
  selectedSeatId: number | null;
  onSelectSeat: (seat: Seat) => void;
}

const STAGE_WIDTH = 560;
const STAGE_HEIGHT = 920;

export const KonvaSeatMap: React.FC<KonvaSeatMapProps> = ({ seats, selectedSeatId, onSelectSeat }) => {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Client-side mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Container Responsive Auto-fit Scale & Mobile Detection
  useEffect(() => {
    if (!isMounted) return;
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setStagePos({ x: 0, y: 0 }); // Reset position fixed in middle on mobile
      }
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newScale = Math.min(1, (containerWidth - 24) / STAGE_WIDTH);
        setScale(newScale > 0.35 ? newScale : 0.35);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  // Fallback template for 18 study seats (IDs 1-18)
  const rawSeats: Seat[] = seats && seats.length > 0 ? seats : Array.from({ length: 18 }, (_, index) => {
    const id = index + 1;
    return {
      id,
      seatNumber: `Seat #${id.toString().padStart(2, '0')}`,
      status: 'available' as const,
      type: id <= 9 ? 'Standard Desk' : 'Premium Quiet Zone Desk',
      pricePerMonth: 900,
      hasPowerSocket: true,
      hasDeskLamp: true,
    };
  });
  const activeSeats = rawSeats.filter((seat) => seat.id <= 18);

  const getSeatCoords = (seatId: number) => {
    switch (seatId) {
      case 7: return { x: 75, y: 130, orientation: 'right' };
      case 6: return { x: 75, y: 225, orientation: 'right' };
      case 5: return { x: 75, y: 320, orientation: 'right' };
      case 4: return { x: 75, y: 415, orientation: 'right' };
      case 3: return { x: 75, y: 510, orientation: 'right' };
      case 2: return { x: 75, y: 605, orientation: 'right' };
      case 1: return { x: 75, y: 700, orientation: 'right' };

      case 17: return { x: 475, y: 110, orientation: 'left' };
      case 10: return { x: 475, y: 180, orientation: 'left' };
      case 11: return { x: 475, y: 250, orientation: 'left' };
      case 12: return { x: 475, y: 320, orientation: 'left' };
      case 13: return { x: 475, y: 390, orientation: 'left' };
      case 14: return { x: 475, y: 460, orientation: 'left' };
      case 15: return { x: 475, y: 530, orientation: 'left' };
      case 16: return { x: 475, y: 600, orientation: 'left' };
      case 18: return { x: 475, y: 670, orientation: 'left' };

      case 8: return { x: 290, y: 750, orientation: 'up' };
      case 9: return { x: 400, y: 750, orientation: 'up' };

      default:
        return { x: 100, y: 100, orientation: 'right' };
    }
  };

  const handleZoomIn = () => setStageScale((prev) => Math.min(prev * 1.2, 2.5));
  const handleZoomOut = () => setStageScale((prev) => Math.max(prev / 1.2, 0.8));
  const handleResetZoom = () => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  const getSeatColors = (seat: Seat, isSelected: boolean) => {
    if (seat.status === 'occupied') {
      return {
        bg: '#FEF3C7',
        border: '#F59E0B',
        chairFill: '#D97706',
        glow: 'transparent',
        shadowBlur: 2,
      };
    }
    if (isSelected) {
      return {
        bg: '#113826',
        border: '#10B981',
        chairFill: '#34D399',
        glow: '#10B981',
        shadowBlur: 16,
      };
    }
    return {
      bg: '#ECFDF5',
      border: '#059669',
      chairFill: '#059669',
      glow: '#34D399',
      shadowBlur: 6,
    };
  };

  if (!isMounted) {
    return (
      <div className="w-full h-[650px] bg-[#FAF7F0] rounded-3xl border-2 border-[#E5DEC3] flex flex-col items-center justify-center space-y-4 p-8 animate-pulse">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-[#113826]">Initializing Interactive Graphical Floor Plan...</p>
      </div>
    );
  }

  const tooltipCoords = hoveredSeat ? getSeatCoords(hoveredSeat.id) : { x: 0, y: 0 };

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {/* Controls & Legend Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-[#F4EFE6] p-4 rounded-2xl border border-[#E3DBD0]">
        <div className="flex items-center space-x-5 text-xs font-bold text-[#113826]">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-[#ECFDF5] border-2 border-[#059669]" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-[#FEF3C7] border-2 border-[#F59E0B]" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-[#113826] border-2 border-[#10B981]" />
            <span>Selected</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-white border border-[#DDD6C8] hover:bg-[#EDE7DD] transition text-[#113826]"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-white border border-[#DDD6C8] hover:bg-[#EDE7DD] transition text-[#113826]"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-xl bg-white border border-[#DDD6C8] hover:bg-[#EDE7DD] transition text-[#113826]"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center text-xs font-medium text-[#6B7280] pl-2 border-l border-[#DCD4C6]">
            <Hand className="w-3.5 h-3.5 mr-1 text-[#113826]" /> Drag stage to pan
          </div>
        </div>
      </div>

      {/* Stage Container */}
      <div
        ref={containerRef}
        className="relative w-full flex justify-center bg-[#FDFBF7] rounded-3xl border-2 border-[#E5DEC3] shadow-inner p-2 sm:p-4 overflow-hidden"
      >
        <div
          style={{
            width: STAGE_WIDTH * scale,
            height: STAGE_HEIGHT * scale,
          }}
          className="relative transition-all duration-300 ease-out"
        >
          <Stage
            ref={stageRef}
            width={STAGE_WIDTH}
            height={STAGE_HEIGHT}
            scaleX={scale * stageScale}
            scaleY={scale * stageScale}
            x={isMobile ? 0 : stagePos.x}
            y={isMobile ? 0 : stagePos.y}
            draggable={!isMobile}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              if (!isMobile) {
                setIsDragging(false);
                setStagePos({ x: e.target.x(), y: e.target.y() });
              }
            }}
            className={isMobile ? 'rounded-2xl touch-pan-y' : 'cursor-grab active:cursor-grabbing rounded-2xl'}
          >
            {/* LAYER 1: STATIC ARCHITECTURAL BACKGROUND (listening={false} for 60 FPS mobile performance) */}
            <Layer listening={false}>
              <Rect
                x={0}
                y={0}
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
                fill="#FDFBF7"
                stroke="#EAE3D5"
                strokeWidth={2}
                cornerRadius={16}
              />

              {Array.from({ length: 14 }).map((_, i) => (
                <Line
                  key={`v-${i}`}
                  points={[i * 40, 0, i * 40, STAGE_HEIGHT]}
                  stroke="#F0EAE0"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              ))}
              {Array.from({ length: 23 }).map((_, i) => (
                <Line
                  key={`h-${i}`}
                  points={[0, i * 40, STAGE_WIDTH, i * 40]}
                  stroke="#F0EAE0"
                  strokeWidth={1}
                  dash={[4, 4]}
                />
              ))}

              {/* Main Outer Box Wall */}
              <Line
                points={[
                  35, 40,
                  STAGE_WIDTH - 35, 40,
                  STAGE_WIDTH - 35, 780,
                  240, 780,
                  240, 880,
                  35, 880,
                  35, 40,
                ]}
                stroke="#1E2421"
                strokeWidth={7}
                lineCap="round"
                lineJoin="round"
              />

              {/* Wooden Entrance Door */}
              <Group x={100} y={780}>
                <Rect x={0} y={0} width={100} height={100} fill="#EFE8DA" stroke="#1E2421" strokeWidth={2} />
                <Rect x={10} y={10} width={80} height={85} fill="#9A562B" stroke="#6D3B1B" strokeWidth={2} cornerRadius={4} />
                <Rect x={20} y={20} width={60} height={30} fill="#884A23" stroke="#6D3B1B" strokeWidth={1} cornerRadius={2} />
                <Rect x={20} y={55} width={60} height={32} fill="#884A23" stroke="#6D3B1B" strokeWidth={1} cornerRadius={2} />
                <Circle x={72} y={52} radius={5} fill="#FBBF24" stroke="#D97706" strokeWidth={1} />
                <Arc x={10} y={95} innerRadius={70} outerRadius={71} angle={90} rotation={-90} fill="#9A562B" stroke="#9A562B" dash={[3, 3]} />
              </Group>

              {/* Top Stand Fan */}
              <Group x={STAGE_WIDTH / 2 - 25} y={45}>
                <Rect x={15} y={35} width={20} height={15} fill="#E2D8C7" stroke="#8C7F6B" strokeWidth={1.5} cornerRadius={3} />
                <Line points={[25, 20, 25, 35]} stroke="#8C7F6B" strokeWidth={3} />
                <Circle x={25} y={15} radius={18} fill="#DBEAFE" stroke="#3B82F6" strokeWidth={2} />
                <Arc x={25} y={15} innerRadius={0} outerRadius={14} angle={60} rotation={0} fill="#60A5FA" />
                <Arc x={25} y={15} innerRadius={0} outerRadius={14} angle={60} rotation={120} fill="#60A5FA" />
                <Arc x={25} y={15} innerRadius={0} outerRadius={14} angle={60} rotation={240} fill="#60A5FA" />
                <Circle x={25} y={15} radius={4} fill="#1D4ED8" />
              </Group>

              {/* Ceiling Fan 1 */}
              <Group x={STAGE_WIDTH / 2 - 15} y={300}>
                <Circle x={0} y={0} radius={10} fill="#1E2421" stroke="#000000" strokeWidth={2} />
                {[0, 120, 240].map((deg, idx) => {
                  const angleRad = (deg * Math.PI) / 180;
                  return (
                    <Line
                      key={`fan1-b-${idx}`}
                      points={[0, 0, Math.cos(angleRad) * 55, Math.sin(angleRad) * 55]}
                      stroke="#1E2421"
                      strokeWidth={14}
                      lineCap="round"
                    />
                  );
                })}
                <Circle x={0} y={0} radius={4} fill="#FFFFFF" />
              </Group>

              {/* Ceiling Fan 2 */}
              <Group x={STAGE_WIDTH / 2 - 15} y={550}>
                <Circle x={0} y={0} radius={10} fill="#1E2421" stroke="#000000" strokeWidth={2} />
                {[30, 150, 270].map((deg, idx) => {
                  const angleRad = (deg * Math.PI) / 180;
                  return (
                    <Line
                      key={`fan2-b-${idx}`}
                      points={[0, 0, Math.cos(angleRad) * 55, Math.sin(angleRad) * 55]}
                      stroke="#1E2421"
                      strokeWidth={14}
                      lineCap="round"
                    />
                  );
                })}
                <Circle x={0} y={0} radius={4} fill="#FFFFFF" />
              </Group>
            </Layer>

            {/* LAYER 2: INTERACTIVE STUDY SEATS */}
            <Layer>
              {activeSeats.map((seat) => {
                const { x, y, orientation } = getSeatCoords(seat.id);
                const isSelected = selectedSeatId === seat.id;
                const isOccupied = seat.status === 'occupied';
                const colors = getSeatColors(seat, isSelected);
                const isHovered = hoveredSeat?.id === seat.id;

                return (
                  <Group
                    key={`seat-group-${seat.id}`}
                    x={x}
                    y={y}
                    onClick={() => !isOccupied && !isDragging && onSelectSeat(seat)}
                    onTap={() => !isOccupied && !isDragging && onSelectSeat(seat)}
                    onMouseEnter={() => {
                      if (!isDragging) {
                        setHoveredSeat(seat);
                        const container = stageRef.current?.container();
                        if (container) {
                          container.style.cursor = isOccupied ? 'not-allowed' : 'pointer';
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredSeat(null);
                      const container = stageRef.current?.container();
                      if (container) {
                        container.style.cursor = 'grab';
                      }
                    }}
                  >
                    {/* Seat Number Text */}
                    <Text
                      x={orientation === 'right' ? 55 : orientation === 'left' ? -45 : 0}
                      y={orientation === 'up' ? -25 : orientation === 'down' ? 45 : 8}
                      text={`${seat.id}`}
                      fontSize={16}
                      fontStyle="bold"
                      fontFamily="Inter, sans-serif"
                      fill="#1E2421"
                      align="center"
                    />

                    {/* Armchair (Orientation 'up') */}
                    <Group visible={orientation === 'up'} scaleX={isHovered ? 1.08 : 1} scaleY={isHovered ? 1.08 : 1}>
                      <Rect
                        x={-25}
                        y={-25}
                        width={50}
                        height={50}
                        fill={colors.bg}
                        stroke={colors.border}
                        strokeWidth={isSelected ? 3 : 2}
                        cornerRadius={14}
                        shadowColor={colors.glow}
                        shadowBlur={isHovered ? 18 : colors.shadowBlur}
                        shadowOpacity={0.8}
                      />
                      <Rect x={-18} y={-20} width={36} height={14} fill={colors.chairFill} cornerRadius={6} />
                      <Rect x={-16} y={-4} width={32} height={20} fill={colors.chairFill} cornerRadius={5} />
                      <Rect x={-22} y={-10} width={6} height={22} fill={colors.border} cornerRadius={3} />
                      <Rect x={16} y={-10} width={6} height={22} fill={colors.border} cornerRadius={3} />
                    </Group>

                    {/* Profile Chair (Orientation 'left', 'right', 'down') */}
                    <Group
                      visible={orientation !== 'up'}
                      scaleX={(orientation === 'left' ? -1 : 1) * (isHovered ? 1.08 : 1)}
                      scaleY={isHovered ? 1.08 : 1}
                    >
                      <Rect
                        x={-22}
                        y={-26}
                        width={48}
                        height={52}
                        fill={colors.bg}
                        stroke={colors.border}
                        strokeWidth={isSelected ? 3 : 2}
                        cornerRadius={12}
                        shadowColor={colors.glow}
                        shadowBlur={isHovered ? 18 : colors.shadowBlur}
                        shadowOpacity={0.8}
                      />
                      <Line points={[-12, -18, -6, 12]} stroke={colors.chairFill} strokeWidth={6} lineCap="round" />
                      <Line points={[-8, 12, 16, 12]} stroke={colors.chairFill} strokeWidth={6} lineCap="round" />
                      <Line points={[-2, -2, 12, -2]} stroke={colors.border} strokeWidth={3} lineCap="round" />
                    </Group>

                    {/* Occupied Lock Badge */}
                    <Group visible={isOccupied}>
                      <Circle x={0} y={0} radius={8} fill="#F59E0B" />
                      <Circle x={0} y={0} radius={3.5} fill="#FFFFFF" />
                    </Group>

                    {/* Selected Badge */}
                    <Group visible={isSelected}>
                      <Circle x={0} y={0} radius={9} fill="#10B981" stroke="#FFFFFF" strokeWidth={1.5} />
                      <Circle x={0} y={0} radius={4} fill="#FFFFFF" />
                    </Group>
                  </Group>
                );
              })}
            </Layer>

            {/* LAYER 3: HOVER TOOLTIP */}
            <Layer>
              <Group
                visible={!!hoveredSeat}
                x={tooltipCoords.x}
                y={tooltipCoords.y - 65}
              >
                <Rect
                  x={-75}
                  y={-40}
                  width={150}
                  height={55}
                  fill="#1E2421"
                  cornerRadius={10}
                  shadowColor="#000000"
                  shadowBlur={12}
                  shadowOpacity={0.4}
                />
                <Text
                  x={-68}
                  y={-32}
                  text={`Cubicle #${(hoveredSeat?.id || 1).toString().padStart(2, '0')}`}
                  fontSize={13}
                  fontStyle="bold"
                  fill="#FFFFFF"
                  fontFamily="Inter, sans-serif"
                />
                <Text
                  x={-68}
                  y={-14}
                  text={`${(hoveredSeat?.status || 'available').toUpperCase()} • ₹900/mo`}
                  fontSize={11}
                  fontStyle="bold"
                  fill={hoveredSeat?.status === 'occupied' ? '#FBBF24' : '#34D399'}
                  fontFamily="Inter, sans-serif"
                />
                <Text
                  x={-68}
                  y={2}
                  text="⚡ Power Socket • 💡 Light"
                  fontSize={9}
                  fill="#9CA3AF"
                  fontFamily="Inter, sans-serif"
                />
              </Group>
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Footer Details */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs text-[#55625B] px-2 font-medium">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Click any available green seat to complete your monthly desk reservation.</span>
        </div>
        <div className="flex items-center space-x-3 text-[#113826] font-bold">
          <span>⚡ Dedicated Power</span>
          <span>•</span>
          <span>💡 Personal Lamp</span>
          <span>•</span>
          <span>Fan Cooling</span>
        </div>
      </div>
    </div>
  );
};

export default KonvaSeatMap;
