/**
 * @file page.tsx (About Us Route)
 * @description Dedicated About Us page route giving comprehensive context on Keishampat Reading Space.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Target, BookOpen, HeartHandshake, ShieldCheck, CheckCircle2, Calendar } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Page Header Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#113826] uppercase tracking-widest bg-[#EBE5DA] px-4 py-1.5 rounded-full">
          ABOUT KEISHAMPAT READING SPACE
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#113826] tracking-tight">
          Designed Specifically for Serious Students
        </h1>
        <p className="text-lg text-[#55625B] leading-relaxed">
          Keishampat Reading Space was built with a single mission: to provide a quiet, distraction-free environment where aspirants can focus completely on achieving their academic & competitive exam goals.
        </p>
      </div>

      {/* Grid: Image + Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 relative h-[400px] rounded-3xl overflow-hidden shadow-xl border border-[#E0D9CB]">
          <Image
            src="/images/hero-bg.jpg"
            alt="Keishampat Reading Space Study Desks"
            fill
            className="object-cover"
          />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <h2 className="text-3xl font-extrabold text-[#113826]">
            Why We Created Keishampat Reading Space
          </h2>
          <p className="text-[#4E5A54] leading-relaxed text-base">
            Studying effectively requires more than just books—it demands a disciplined atmosphere, ergonomic seating, reliable high-speed internet, continuous power backup, and strict silence.
          </p>
          <p className="text-[#4E5A54] leading-relaxed text-base">
            Located conveniently in **Keishampat Keisham Leikai**, our facility accommodates **20 dedicated study seats**, ensuring that every member gets a personal, undisturbed desk equipped with individual power outlets and desk lighting.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="bg-white p-4 rounded-xl border border-[#EBE5DA] flex items-start space-x-3">
              <Target className="w-6 h-6 text-[#113826] flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-[#113826]">Zero Distractions</h4>
                <p className="text-xs text-[#55625B]">Strict silent zone rules enforced at all times.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#EBE5DA] flex items-start space-x-3">
              <ClockIcon className="w-6 h-6 text-[#113826] flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-[#113826]">Long Hours Access</h4>
                <p className="text-xs text-[#55625B]">Open everyday from 5:00 AM to 11:00 PM.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code of Conduct & Study Atmosphere Rules */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EBE5DA] shadow-sm space-y-6">
        <h2 className="text-2xl font-extrabold text-[#113826] text-center">
          Our Reading Space Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#113826] text-white flex items-center justify-center font-bold">1</div>
            <h3 className="font-bold text-[#113826]">Maintain Absolute Silence</h3>
            <p className="text-sm text-[#55625B]">Phone calls must be attended outside the study area. Keep mobile devices on silent mode.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#113826] text-white flex items-center justify-center font-bold">2</div>
            <h3 className="font-bold text-[#113826]">Dedicated Desk Lock</h3>
            <p className="text-sm text-[#55625B]">Your assigned seat is reserved exclusively for you throughout your membership duration.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#F8F6F0] border border-[#E5E0D5] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#113826] text-white flex items-center justify-center font-bold">3</div>
            <h3 className="font-bold text-[#113826]">Clean & Safe Environment</h3>
            <p className="text-sm text-[#55625B]">Food items are restricted in the desk area to maintain hygiene and prevent distractions.</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="text-center pt-4">
        <Link
          href="/book"
          className="inline-flex items-center space-x-3 bg-[#113826] hover:bg-[#0B2318] text-white px-8 py-4 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all"
        >
          <Calendar className="w-5 h-5 text-emerald-300" />
          <span>Reserve Your Seat Now</span>
        </Link>
      </div>

    </div>
  );
}

function ClockIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
  );
}
