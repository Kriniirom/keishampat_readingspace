/**
 * @file HeroSection.tsx
 * @description Hero section component reproducing the exact layout, badge, typography, metadata items,
 * and image blending from the uploaded reference screenshot.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Users, IndianRupee, Calendar, Phone, BookOpen } from 'lucide-react';

interface HeroSectionProps {
  onBookClick?: () => void;
}

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
              
              {/* Location item */}
              <div className="flex items-center space-x-3 text-[#2C3531]">
                <MapPin className="w-5 h-5 text-[#113826] flex-shrink-0" />
                <span className="font-semibold text-base sm:text-lg">Keishampat Keisham Leikai</span>
              </div>

              {/* Operating Hours item */}
              <div className="flex items-center space-x-3 text-[#2C3531]">
                <Clock className="w-5 h-5 text-[#113826] flex-shrink-0" />
                <span className="font-semibold text-base sm:text-lg">5:00 AM – 11:00 PM (Everyday)</span>
              </div>

              {/* Total Seats item */}
              <div className="flex items-center space-x-3 text-[#2C3531]">
                <Users className="w-5 h-5 text-[#113826] flex-shrink-0" />
                <span className="font-semibold text-base sm:text-lg">20 Seats</span>
              </div>

              {/* Pricing item */}
              <div className="flex items-center space-x-3 text-[#2C3531]">
                <IndianRupee className="w-5 h-5 text-[#113826] flex-shrink-0" />
                <span className="font-semibold text-base sm:text-lg">₹900 per month</span>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              
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

              {/* WhatsApp Us Button */}
              <a
                href="https://wa.me/919863429955?text=Hello%20Keishampat%20Reading%20Space%2C%20I%20would%20like%20to%20know%20more%20about%20seat%20availability."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2.5 bg-white border border-[#D5CFBF] hover:border-[#113826] text-[#1E2421] px-7 py-3.5 rounded-xl font-semibold text-base shadow-sm hover:shadow-md transition-all active:scale-95"
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
            
            {/* Ambient lighting soft glow effect */}
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium tracking-wide border border-white/20">
              📍 Keishampat Keisham Leikai
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
