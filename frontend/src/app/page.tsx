/**
 * @file page.tsx
 * @description Home Page route component.
 * Features exact reproduction of reference image layout (HeroSection, FeatureBanner),
 * and the 20-Seat Layout Map ('Reserve Your Desk Online'). Clicking 'Book Your Seat'
 * directs the user straight to the seat selection map.
 */

'use client';

import React, { useEffect, useState } from 'react';
import HeroSection from '../components/HeroSection';
import FeatureBanner from '../components/FeatureBanner';
import SeatGrid from '../components/SeatGrid';
import BookingModal from '../components/BookingModal';
import { Seat, fetchSeats, fetchPlans, MembershipPlan } from '../lib/api';
import { CheckCircle2, ArrowRight, Sparkles, MapPin, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch seat status & membership plans via Axios on component load
  const loadData = async () => {
    try {
      setLoading(true);
      const [seatData, planData] = await Promise.all([fetchSeats(), fetchPlans()]);
      setSeats(seatData.seats);
      setPlans(planData);
    } catch (error) {
      console.error('Error loading initial home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSeat = (seat: Seat) => {
    setSelectedSeat(seat);
    setIsModalOpen(true);
  };

  const handleBookYourSeatClick = () => {
    // Navigate directly to the Reserve Your Desk Online page (/book)
    router.push('/book');
  };

  return (
    <div className="space-y-12">
      {/* 1. Primary Hero Section (Exact match to reference screenshot) */}
      <HeroSection onBookClick={handleBookYourSeatClick} />

      {/* 2. Floating 4-Feature Cards Banner */}
      <FeatureBanner />

      {/* 3. Reserve Your Desk Online - 20-Seat Layout Map Section */}
      <section id="seat-map" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header matching user screenshot */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
          <span className="text-xs font-bold text-[#113826] uppercase tracking-widest bg-[#EDE7DD] px-4 py-1.5 rounded-full border border-[#DDD6C8]">
            18 DEDICATED STUDY CUBICLES
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#113826] tracking-tight">
            Reserve Your Desk Online
          </h2>
          <p className="text-base sm:text-lg text-[#55625B] font-medium leading-relaxed">
            Choose your preferred seat number from the layout below to complete your monthly subscription reservation.
          </p>
        </div>

        {/* 18-Seat Layout Grid Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-[#EBE5DA] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-[#113826]">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Interactive 18-Seat Layout Map</span>
            </div>

            <button
              onClick={loadData}
              className="flex items-center space-x-2 text-xs font-semibold text-[#55625B] hover:text-[#113826] bg-[#F2EDE4] px-3.5 py-2 rounded-xl border border-[#E2DBD0] transition-all hover:bg-[#EAE3D6]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Availability</span>
            </button>
          </div>

          {/* Render 20-Seat Visual Grid */}
          <SeatGrid
            seats={seats}
            selectedSeatId={selectedSeat?.id || null}
            onSelectSeat={handleSelectSeat}
          />
        </div>
      </section>

      {/* 4. Membership Plans Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold text-[#113826] uppercase tracking-widest bg-[#EDE7DD] px-3.5 py-1 rounded-full border border-[#DDD6C8]">
            AFFORDABLE PRICING
          </span>
          <h2 className="text-3xl font-extrabold text-[#113826]">
            Transparent & Simple Membership
          </h2>
          <p className="text-[#55625B] text-base">
            No hidden charges. Enjoy full access to your dedicated desk for just ₹900/month.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-8 border transition-all flex flex-col justify-between ${
                plan.popular
                  ? 'border-[#113826] ring-2 ring-[#113826] shadow-xl scale-105'
                  : 'border-[#EBE5DA] shadow-sm hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#113826] text-emerald-300 text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full shadow">
                  MOST POPULAR
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-[#113826]">{plan.title}</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-[#1E2421]">{plan.currency}{plan.price}</span>
                  <span className="text-sm font-semibold text-[#55625B]">{plan.billingCycle}</span>
                </div>
                <p className="text-sm text-[#55625B]">{plan.description}</p>

                <ul className="space-y-3 pt-4 border-t border-[#F2ECE1] text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3 text-[#2C3531]">
                      <CheckCircle2 className="w-4 h-4 text-[#113826] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/book"
                  className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.popular
                      ? 'bg-[#113826] hover:bg-[#0B2318] text-white shadow-md'
                      : 'bg-[#EDE7DD] hover:bg-[#113826] hover:text-white text-[#113826]'
                  }`}
                >
                  Book This Plan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Location Banner CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#113826] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Ready to Upgrade Your Study Routine?
            </h2>
            <p className="text-emerald-100/90 text-base leading-relaxed">
              Visit Keishampat Reading Space at Keishampat Keisham Leikai today or reserve your seat online before spots fill up.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-emerald-300 font-semibold">
              <span className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Keishampat Keisham Leikai</span>
              </span>
              <span className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>5:00 AM – 11:00 PM</span>
              </span>
            </div>
          </div>

          <div className="z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              href="/book"
              className="bg-white text-[#113826] hover:bg-emerald-50 px-8 py-4 rounded-xl font-bold text-base shadow-lg transition-all text-center"
            >
              Book Your Seat Now
            </Link>
            <a
              href="https://wa.me/919863429955"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-500/50 text-white px-6 py-4 rounded-xl font-semibold text-base transition-all text-center"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Seat Booking Modal Component (Opens ONLY when a seat is clicked on the grid) */}
      <BookingModal
        seat={selectedSeat}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
