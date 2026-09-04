/**
 * @file HeroSection.tsx
 * @description Hero section component reproducing the exact layout, badge, typography, metadata items,
 * and image blending from the uploaded reference screenshot.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Users,
  IndianRupee,
  Calendar,
  Phone,
  BookOpen,
  Navigation,
  ArrowUpRight
} from 'lucide-react';

interface HeroSectionProps {
  onBookClick?: () => void;
}

// Exact Google Maps Directions link directly to Keishampat Reading Space
const GOOGLE_MAPS_DIRECTIONS_URL = 'https://maps.app.goo.gl/U53zzf8mW8xtqVeXA?g_st=awb';

export const HeroSection: React.FC<HeroSectionProps> = ({ onBookClick }) => {
  return (
    <section className="relative overflow-hidden bg-[#F8F6F0] min-h-[580px] flex items-center pt-8 pb-16">

      {/* Container holding text content (left) and blended background photo (right) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column - Headline, Meta info, Badges & CTAs */}
          <div className="lg:col-span-6 space-y-6 pt-4 lg:pt-0">

            {/* Top Pill Tag Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EDE7DD] border border-[#DDD6C8] text-[#3D4742] text-xs font-bold tracking-wider uppercase">
              <BookOpen className="w-3.5 h-3.5 text-[#113826]" />
              <span>FOCUS. STUDY. SUCCEED.</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#113826] tracking-tight leading-[1.08]">
                Keishampat
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1E2421] tracking-tight leading-[1.08]">
                Reading Space
              </h1>
            </div>

            {/* Subtitle paragraph */}
            <p className="text-lg sm:text-xl text-[#4E5A54] font-medium max-w-lg leading-relaxed">
              A peaceful and productive environment designed for serious students.
            </p>

            {/* Key Information Metadata List */}
            <div className="space-y-3 pt-2">

              {/* Location item with quick directions link */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[#2C3531]">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-[#113826] flex-shrink-0" />
                  <span className="font-semibold text-base sm:text-lg">Keishampat Keisham Leikai</span>
                </div>
                <a
                  href={GOOGLE_MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-[#113826] bg-[#EDE7DD] hover:bg-[#113826] hover:text-white border border-[#DDD6C8] px-2.5 py-1 rounded-full transition-all shadow-xs"
                  title="View directions on Google Maps"
                >
                  <span>Directions</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>

              {/* Operating Hours item */}
              <div className="flex items-center space-x-3 text-[#2C3531]">
                <Clock className="w-5 h-5 text-[#113826] flex-shrink-0" />
                <span className="font-semibold text-base sm:text-lg">5:00 AM – 11:00 PM (Everyday)</span>
              </div>

              {/* Total Seats item */}
              <div className="flex items-center space-x-3 text-[#2C3531]">
                <Users className="w-5 h-5 text-[#113826] flex-shrink-0" />
                <span className="font-semibold text-base sm:text-lg">18 Seats</span>
              </div>

              {/* Pricing item */}
              <div className="flex items-center space-x-3 text-[#2C3531]">
                <IndianRupee className="w-5 h-5 text-[#113826] flex-shrink-0" />
                <span className="font-semibold text-base sm:text-lg">₹900 per month</span>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-4">

              {/* Book Your Seat Button */}
              {onBookClick ? (
                <button
                  onClick={onBookClick}
                  className="inline-flex items-center space-x-2.5 bg-[#113826] hover:bg-[#0A2619] text-white px-7 py-3.5 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <Calendar className="w-5 h-5 text-emerald-300" />
                  <span>Book Your Seat</span>
                </button>
              ) : (
                <Link
                  href="/book"
                  className="inline-flex items-center space-x-2.5 bg-[#113826] hover:bg-[#0A2619] text-white px-7 py-3.5 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <Calendar className="w-5 h-5 text-emerald-300" />
                  <span>Book Your Seat</span>
                </Link>
              )}

              {/* Professional Get Directions Button */}
              <a
                href={GOOGLE_MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center space-x-2.5 bg-white hover:bg-[#F4EFE6] border border-[#D5CFBF] hover:border-[#113826] text-[#113826] px-6 py-3.5 rounded-xl font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                title="Open Google Maps to map turn-by-turn directions toward Keishampat Reading Space"
              >
                <div className="w-7 h-7 rounded-lg bg-[#113826]/10 group-hover:bg-[#113826] flex items-center justify-center transition-colors">
                  <Navigation className="w-4 h-4 text-[#113826] group-hover:text-emerald-300 transition-all duration-300 transform group-hover:-rotate-12 group-hover:scale-110" />
                </div>
                <span>Get Directions</span>
              </a>

              {/* WhatsApp Us Button */}
              <a
                href="https://wa.me/919863429955?text=Hello%20Keishampat%20Reading%20Space%2C%20I%20would%20like%20to%20know%20more%20about%20seat%20availability."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2.5 bg-white border border-[#D5CFBF] hover:border-[#113826] text-[#1E2421] px-6 py-3.5 rounded-xl font-semibold text-base shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <Phone className="w-5 h-5 text-[#113826]" />
                <span>WhatsApp Us</span>
              </a>
            </div>

          </div>

          {/* Right Column - Hero Photograph with Gradient Blend */}
          <div className="lg:col-span-6 relative mt-6 lg:mt-0 h-[400px] sm:h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-white/60">
            <Image
              src="/images/hero-bg.jpg"
              alt="Keishampat Reading Space Interior Study Desk Cubicles"
              fill
              priority
              className="object-cover object-center"
            />

            {/* Left Gradient Overlay to create smooth fade effect into beige background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F8F6F0] via-[#F8F6F0]/60 to-transparent w-full lg:w-2/3 pointer-events-none" />

            {/* Ambient lighting soft glow effect / Interactive directions badge */}
            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 bg-black/50 hover:bg-[#113826] backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full font-medium tracking-wide border border-white/20 hover:border-emerald-400 flex items-center space-x-1.5 transition-all shadow-lg group cursor-pointer"
              title="Click to map directions to Keishampat Reading Space"
            >
              <Navigation className="w-3 h-3 text-emerald-300 group-hover:-rotate-12 transition-transform" />
              <span>Keishampat Keisham Leikai</span>
              <ArrowUpRight className="w-3 h-3 text-white/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
