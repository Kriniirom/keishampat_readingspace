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
      src: '/images/reading-hall-cubicles.jpg',
      title: 'Study Cubicles Row (Desks #01–#06)',
      category: 'Main Reading Hall',
      desc: 'Private individual cubicles with tall white partition dividers, personal task lighting, and ergonomic study chairs.',
    },
    {
      src: '/images/student-reading.jpg',
      title: 'Deep Focus Study Session',
      category: 'Quiet Study Zone',
      desc: 'An undisturbed, peaceful environment designed specifically for competitive exam aspirants and serious readers.',
    },
    {
      src: '/images/desk-setup.jpg',
      title: 'Personal Cubicle Workspace Setup',
      category: 'Desk Amenities',
      desc: 'Each desk features dedicated power sockets, personal overhead LED spotlight, and ample space for books and laptop.',
    },
    {
      src: '/images/rooftop-terrace.jpg',
      title: 'Open-Air Rooftop Relaxation Terrace',
      category: 'Outdoor Break Zone',
      desc: 'Refreshing rooftop area with wooden benches, green plants, and panoramic views of the city hills for study breaks.',
    },
    {
      src: '/images/interior-decor.jpg',
      title: 'Aesthetic Staircase & Greenery',
      category: 'Interior Ambience',
      desc: 'Clean, peaceful corners decorated with calming wall art and natural air-purifying snake plants.',
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
