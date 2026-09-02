/**
 * @file page.tsx (Gallery Route)
 * @description Gallery page route showcasing high-resolution photos of Keishampat Reading Space.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, Calendar, Eye } from 'lucide-react';

export default function GalleryPage() {
  const photos = [
    {
      src: '/images/hero-bg.jpg',
      title: 'Study Desk Cubicles Row',
      category: 'Main Reading Hall',
      desc: '19 individual wooden study desks with ergonomic seating and warm overhead lighting.',
    },
    {
      src: '/images/desk-closeup.jpg',
      title: 'Individual Workspace Setup',
      category: 'Desk Amenities',
      desc: 'Each cubicle desk features dedicated power outlets, personal LED lamps, and ample surface space.',
    },
    {
      src: '/images/hero-bg.jpg',
      title: 'Motivation Walls',
      category: 'Study Ambience',
      desc: 'Clean white interior walls featuring inspirational study quotes: "DISCIPLINE TODAY SUCCESS TOMORROW".',
    },
    {
      src: '/images/desk-closeup.jpg',
      title: 'Quiet Study Environment',
      category: 'Focus Zone',
      desc: 'Undisturbed environment tailored for serious aspirants preparing for competitive examinations.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#113826] uppercase tracking-widest bg-[#EBE5DA] px-4 py-1.5 rounded-full">
          PHOTO GALLERY
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#113826] tracking-tight">
          Inside Keishampat Reading Space
        </h1>
        <p className="text-lg text-[#55625B]">
          Explore the clean, quiet, and well-equipped environment waiting for your daily study sessions.
        </p>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {photos.map((item, index) => (
          <div
            key={index}
            className="group bg-white rounded-3xl overflow-hidden border border-[#EBE5DA] shadow-sm hover:shadow-xl transition-all flex flex-col"
          >
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#EAE4D8]">
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-[#113826]/90 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
                {item.category}
              </div>
            </div>

            <div className="p-6 space-y-2 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#113826] group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-[#55625B] mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between text-xs text-[#727D77]">
                <span>📍 Keishampat Keisham Leikai</span>
                <span className="flex items-center space-x-1 font-semibold text-[#113826]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>18 Seats Facility</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="bg-[#113826] text-white rounded-3xl p-8 sm:p-12 text-center space-y-4">
        <h2 className="text-3xl font-extrabold">Ready to Reserve Your Spot?</h2>
        <p className="text-emerald-100 max-w-xl mx-auto text-base">
          Book online in seconds to secure your personal desk at Keishampat Reading Space.
        </p>
        <div className="pt-2">
          <Link
            href="/book"
            className="inline-flex items-center space-x-2 bg-white text-[#113826] hover:bg-emerald-50 px-8 py-3.5 rounded-xl font-extrabold text-base shadow-lg transition-all"
          >
            <Calendar className="w-5 h-5 text-[#113826]" />
            <span>Book Your Desk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
