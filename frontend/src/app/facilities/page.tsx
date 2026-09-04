/**
 * @file page.tsx (Facilities Route)
 * @description Facilities & Amenities breakdown page route.
 */

'use client';

import React from 'react';
import { Armchair, VolumeX, Wifi, ShieldCheck, Zap, Lamp, Droplets, BatteryCharging, Wind } from 'lucide-react';
import Link from 'next/link';

export default function FacilitiesPage() {
  const facilityList = [
    {
      icon: Armchair,
      title: '18 Dedicated Study Desks',
      desc: 'Spacious individual wooden cubicle desks with ergonomic chairs for long study hours without fatigue.',
    },
    {
      icon: VolumeX,
      title: 'Silent & Focused Atmosphere',
      desc: 'Strict quiet zone rules enforced 24/7 to maintain 100% concentration and productivity.',
    },
    {
      icon: Wifi,
      title: 'High-Speed Wi-Fi',
      desc: 'Blazing fast fiber internet connectivity for online classes, video lectures, and research materials.',
    },
    {
      icon: ShieldCheck,
      title: '24/7 CCTV Security',
      desc: 'Comprehensive round-the-clock CCTV surveillance to ensure safe study conditions for all students.',
    },
    {
      icon: Zap,
      title: 'Individual Power Outlets',
      desc: 'Dedicated electrical plug points at every single cubicle for uninterrupted charging of devices.',
    },
    {
      icon: Lamp,
      title: 'Personal Desk Lights',
      desc: 'Soft, eye-friendly LED desk lamps installed at every desk for comfortable early morning or late night reading.',
    },
    {
      icon: Droplets,
      title: 'RO Drinking Water',
      desc: 'Purified drinking water available on-site to keep you refreshed and hydrated throughout the day.',
    },
    {
      icon: BatteryCharging,
      title: 'Uninterrupted Power Backup',
      desc: 'Inverter power backup system ensuring continuous lighting and Wi-Fi during local power outages.',
    },
    {
      icon: Wind,
      title: 'Ventilated & Air-Cooled',
      desc: 'Proper natural air ventilation and ceiling fans to keep the study room ambient and fresh.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#113826] uppercase tracking-widest bg-[#EBE5DA] px-4 py-1.5 rounded-full">
          FACILITIES & AMENITIES
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#113826] tracking-tight">
          Everything You Need for Exam Success
        </h1>
        <p className="text-lg text-[#55625B]">
          We have engineered every detail of Keishampat Reading Space to provide an optimal study experience.
        </p>
      </div>

      {/* 9 Facility Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {facilityList.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-[#EBE5DA] shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#113826] text-white flex items-center justify-center shadow-md">
                <IconComp className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#113826]">{item.title}</h3>
              <p className="text-sm text-[#55625B] leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div className="bg-[#113826] text-white rounded-3xl p-8 sm:p-12 text-center space-y-4">
        <h2 className="text-3xl font-extrabold">Want to Experience Our Study Space?</h2>
        <p className="text-emerald-100 max-w-xl mx-auto text-base">
          Visit Keishampat Keisham Leikai to take a quick tour or book your desk online today.
        </p>
        <div className="pt-2">
          <Link
            href="/book"
            className="inline-block bg-white text-[#113826] hover:bg-emerald-50 px-8 py-3.5 rounded-xl font-extrabold text-base shadow-lg transition-all"
          >
            Check Available Seats
          </Link>
        </div>
      </div>
    </div>
  );
}
