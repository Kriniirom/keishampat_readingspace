/**
 * @file FeatureBanner.tsx
 * @description Floating feature banner component containing 4 key highlights:
 * 20 Dedicated Seats, Silent Environment, High Speed Wi-Fi, and Safe & Secure.
 * Matches the reference image floating card design, circular dark green icons, and clean typography.
 */

'use client';

import React from 'react';
import { Armchair, VolumeX, Wifi, ShieldCheck } from 'lucide-react';

export const FeatureBanner: React.FC = () => {
  const features = [
    {
      icon: Armchair,
      title: '18 Dedicated Seats',
      description: 'Individual study spaces for maximum concentration.',
    },
    {
      icon: VolumeX,
      title: 'Silent Environment',
      description: 'A peaceful and quiet space to help you focus better.',
    },
    {
      icon: Wifi,
      title: 'High Speed Wi-Fi',
      description: 'Fast and reliable internet for your study needs.',
    },
    {
      icon: ShieldCheck,
      title: 'Safe & Secure',
      description: 'CCTV surveillance for your safety and peace of mind.',
    },
  ];

  return (
    <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 pb-16">
      {/* Floating White Card Container with Soft Shadow & Border */}
      <div className="bg-white rounded-2xl shadow-xl border border-[#E9E4DA] p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#EFEAE1]">
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className={`flex items-start space-x-4 ${idx !== 0 ? 'pt-6 lg:pt-0 lg:pl-6' : ''
                  }`}
              >
                {/* Dark Forest Green Circle Badge Icon */}
                <div className="w-14 h-14 bg-[#113826] rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <IconComponent className="w-6 h-6 stroke-[2.2]" />
                </div>

                {/* Feature Title & Description */}
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#113826] tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#55625B] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureBanner;
