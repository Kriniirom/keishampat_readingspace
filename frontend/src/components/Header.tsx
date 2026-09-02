/**
 * @file Header.tsx
 * @description Main top navigation bar matching the reference image layout with 100% precision.
 * Features brand logo, navigation links with active indicators, and top-right WhatsApp CTA button.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, BookOpen, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation link items configuration
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Membership', href: '/membership' },
    { name: 'Facilities', href: '/facilities' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F8F6F0]/90 backdrop-blur-md border-b border-[#EBE6DD] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center space-x-3 group">
          {/* Green Logo Icon Square */}
          <div className="w-11 h-11 bg-[#113826] rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <div className="relative flex flex-col items-center justify-center">
              <span className="font-bold text-xl leading-none">K</span>
              <BookOpen className="w-4 h-4 text-emerald-300 mt-[-2px]" />
            </div>
          </div>
          
          {/* Brand Name Typography */}
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-[#113826] tracking-tight leading-none">
              Keishampat
            </span>
            <span className="text-sm font-medium text-[#4A5550] tracking-tight mt-0.5">
              Reading Space
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Menu Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-[#113826]' : 'text-[#3B4641] hover:text-[#113826]'
                }`}
              >
                {item.name}
                {/* Active Indicator Underline (As shown in reference image for Home) */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#113826] rounded-full transition-all" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Action CTA Button (WhatsApp Contact) */}
        <div className="hidden sm:flex items-center">
          <a
            href="https://wa.me/919863429955?text=Hello%20Keishampat%20Reading%20Space%2C%20I%20would%20like%20to%20inquire%20about%20seat%20booking."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-[#113826] hover:bg-[#0B2318] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Phone className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span className="tracking-wide">98634 29955</span>
          </a>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#113826] hover:bg-[#EDE8DE] focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F8F6F0] border-b border-[#EBE6DD] px-4 pt-3 pb-6 space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-base font-semibold ${
                pathname === item.href
                  ? 'bg-[#113826] text-white'
                  : 'text-[#3B4641] hover:bg-[#EDE8DE]'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-2">
            <a
              href="https://wa.me/919863429955"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-[#113826] text-white w-full py-3 rounded-xl font-medium text-sm"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp: 98634 29955</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
