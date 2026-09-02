/**
 * @file page.tsx (Membership & Pricing Route)
 * @description Page route displaying membership plans, inclusions, pricing transparency, and FAQs.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { fetchPlans, MembershipPlan } from '../../lib/api';
import { CheckCircle2, Calendar, HelpCircle, ShieldCheck } from 'lucide-react';
import BookingModal from '../../components/BookingModal';

export default function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPlans().then((res) => setPlans(res));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#113826] uppercase tracking-widest bg-[#EBE5DA] px-4 py-1.5 rounded-full">
          MEMBERSHIP & PRICING
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#113826] tracking-tight">
          Simple, Affordable Plans
        </h1>
        <p className="text-lg text-[#55625B]">
          Get full 18-hour daily access to your dedicated desk starting at just ₹900/month.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-3xl p-8 border transition-all flex flex-col justify-between ${
              plan.popular
                ? 'border-[#113826] ring-2 ring-[#113826] shadow-xl scale-105'
                : 'border-[#EBE5DA] shadow-sm hover:shadow-md'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#113826] text-emerald-300 text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full shadow">
                RECOMMENDED
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-[#113826]">{plan.title}</h3>
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-[#1E2421]">{plan.currency}{plan.price}</span>
                <span className="text-sm font-semibold text-[#55625B]">{plan.billingCycle}</span>
              </div>
              <p className="text-sm text-[#55625B]">{plan.description}</p>

              <ul className="space-y-3 pt-6 border-t border-[#F2ECE1] text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3 text-[#2C3531]">
                    <CheckCircle2 className="w-4 h-4 text-[#113826] flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <button
                onClick={() => setIsModalOpen(true)}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-md ${
                  plan.popular
                    ? 'bg-[#113826] hover:bg-[#0B2318] text-white'
                    : 'bg-[#EDE7DD] hover:bg-[#113826] hover:text-white text-[#113826]'
                }`}
              >
                Choose {plan.title}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EBE5DA] shadow-sm space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <HelpCircle className="w-8 h-8 text-[#113826] mx-auto" />
          <h2 className="text-2xl font-extrabold text-[#113826]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-5 rounded-2xl bg-[#F8F6F0] space-y-2 border border-[#E5E0D5]">
            <h4 className="font-bold text-[#113826]">What are the operating hours?</h4>
            <p className="text-[#55625B]">Keishampat Reading Space is open everyday from 5:00 AM to 11:00 PM, including Sundays and public holidays.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F6F0] space-y-2 border border-[#E5E0D5]">
            <h4 className="font-bold text-[#113826]">Is my seat reserved for me exclusively?</h4>
            <p className="text-[#55625B]">Yes! When you subscribe to the ₹900/month plan, your assigned seat number is dedicated solely to you for the entire duration.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F6F0] space-y-2 border border-[#E5E0D5]">
            <h4 className="font-bold text-[#113826]">Are power outlets provided at each desk?</h4>
            <p className="text-[#55625B]">Each desk features individual power sockets for charging laptops & phones, as well as personal warm desk lights.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F6F0] space-y-2 border border-[#E5E0D5]">
            <h4 className="font-bold text-[#113826]">How can I pay for membership?</h4>
            <p className="text-[#55625B]">We accept Cash, UPI (GPay/PhonePe/Paytm), and Direct Bank Transfers at our facility or upon booking confirmation.</p>
          </div>
        </div>
      </div>

      <BookingModal
        seat={null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
