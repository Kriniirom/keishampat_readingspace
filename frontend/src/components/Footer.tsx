/**
 * @file Footer.tsx
 * @description Footer component containing facility location, contact number, timing schedule,
 * quick page routes, and copyright statement.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, MapPin, Clock, Phone, Mail, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0D261A] text-white border-t border-[#184531]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Info Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center text-white">
                <span className="font-bold text-lg leading-none">K</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-none text-white">
                  Keishampat
                </span>
                <span className="text-xs font-medium text-emerald-300 tracking-tight mt-0.5">
                  Reading Space
                </span>
              </div>
            </div>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              A peaceful and productive environment designed for serious students preparing for competitive exams, board tests, and academic excellence.
            </p>
          </div>

          {/* Quick Page Routes */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-emerald-100/80">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/membership" className="hover:text-white transition-colors">Membership & Pricing</Link>
              </li>
              <li>
                <Link href="/facilities" className="hover:text-white transition-colors">Facilities & Amenities</Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-white transition-colors">Photo Gallery</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-white transition-colors text-emerald-300 font-semibold">Book a Seat</Link>
              </li>
            </ul>
          </div>

          {/* Location & Timings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              Opening Hours & Address
            </h4>
            <div className="space-y-2.5 text-sm text-emerald-100/80">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Keishampat Keisham Leikai, Imphal</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>5:00 AM – 11:00 PM (Everyday)</span>
              </div>
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>19 Dedicated Study Desks</span>
              </div>
            </div>
          </div>

          {/* Contact Details & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              Get In Touch
            </h4>
            <div className="space-y-3">
              <a
                href="tel:9863429955"
                className="flex items-center space-x-3 text-sm text-emerald-100 hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">+91 98634 29955</span>
              </a>
              
              <a
                href="https://wa.me/919863429955"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200/60 gap-4">
          <p>© {new Date().getFullYear()} Keishampat Reading Space. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Designed for serious students with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
