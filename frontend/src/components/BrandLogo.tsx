/**
 * @file BrandLogo.tsx
 * @description Official minimalist brand logo for Keishampat Reading Space.
 * Features a high-fidelity vector emblem symbolizing focused study, an open book, and the beacon of knowledge.
 */

'use client';

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'dark',
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  }[size];

  const titleSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  const subtitleSize = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
  }[size];

  const isLight = theme === 'light';

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Scalable Vector Emblem */}
      <div
        className={`${iconDimensions} relative flex-shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1B4D35" />
              <stop offset="100%" stopColor="#0B2519" />
            </linearGradient>
            <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* Squircle Background Base */}
          <rect
            x="1.5"
            y="1.5"
            width="45"
            height="45"
            rx="12"
            fill="url(#logoBgGrad)"
            stroke="#2E6B4B"
            strokeWidth="1.5"
          />

          {/* Soft inner ambient glow */}
          <circle cx="24" cy="22" r="14" fill="#34D399" opacity="0.15" />

          {/* Left Book Page */}
          <path
            d="M 12 31.5 C 16 29.5 19.5 29.5 23 31.8 L 23 18 C 19.5 15.5 16 15.5 12 17.5 Z"
            fill="#FFFFFF"
            fillOpacity="0.96"
          />
          {/* Left subtle text line hints */}
          <path
            d="M 15 21.5 L 20 21 M 15 25 L 20 24.5 M 15 28.5 L 19 28"
            stroke="#113826"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeOpacity="0.3"
          />

          {/* Right Book Page */}
          <path
            d="M 36 31.5 C 32 29.5 28.5 29.5 25 31.8 L 25 18 C 28.5 15.5 32 15.5 36 17.5 Z"
            fill="#F3F4F6"
            fillOpacity="0.96"
          />
          {/* Right subtle text line hints */}
          <path
            d="M 28 21 L 33 21.5 M 28 24.5 L 33 25 M 29 28 L 33 28.5"
            stroke="#113826"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeOpacity="0.3"
          />

          {/* Center Ribbon Bookmark */}
          <path
            d="M 23 16.5 L 25 16.5 L 25 34 L 24 33 L 23 34 Z"
            fill="url(#logoGoldGrad)"
          />

          {/* Beacon of Knowledge / Study Spark */}
          <circle cx="24" cy="11.5" r="2.2" fill="url(#logoGoldGrad)" />
          <path
            d="M 24 7.5 L 24 8.5 M 24 14.5 L 24 15.5 M 20.5 11.5 L 21.5 11.5 M 26.5 11.5 L 27.5 11.5"
            stroke="url(#logoGoldGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-black ${titleSize} tracking-tight leading-none ${
                isLight ? 'text-white' : 'text-[#113826]'
              }`}
            >
              Keishampat
            </span>
          </div>
          <span
            className={`font-semibold ${subtitleSize} tracking-wider uppercase mt-1 ${
              isLight ? 'text-emerald-300/90' : 'text-[#526058]'
            }`}
          >
            Reading Space
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
