/**
 * @file page.tsx (Contact Route)
 * @description Contact Us page route featuring location details, opening hours, WhatsApp link,
 * and an inquiry form submitting data to Express backend via Axios.
 */

'use client';

import React, { useState } from 'react';
import { submitContactApi } from '../../lib/api';
import { MapPin, Phone, Clock, Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setErrorMsg('Please fill in your name, phone number, and message.');
      return;
    }

    try {
      setLoading(true);
      const res = await submitContactApi({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        subject: subject.trim() || 'General Inquiry',
        message: message.trim(),
      });

      setSuccessMsg(res.message || 'Message sent successfully!');
      setName('');
      setPhone('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#113826] uppercase tracking-widest bg-[#EBE5DA] px-4 py-1.5 rounded-full">
          CONTACT & LOCATION
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-[#113826] tracking-tight">
          Get in Touch with Us
        </h1>
        <p className="text-lg text-[#55625B]">
          Have questions about desk reservations, pricing, or facilities? We are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Location & Direct Details */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-[#EBE5DA] shadow-sm space-y-6">
            <h2 className="text-2xl font-extrabold text-[#113826]">
              Contact Details
            </h2>

            <div className="space-y-5 text-base text-[#2C3531]">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#113826] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#113826]">Address Location</h4>
                  <a
                    href="https://maps.app.goo.gl/U53zzf8mW8xtqVeXA?g_st=awb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#55625B] hover:text-[#113826] hover:underline flex items-center gap-1.5 mt-0.5"
                    title="Get Directions on Google Maps"
                  >
                    <span>Keishampat Keisham Leikai, Imphal, Manipur</span>
                    <span className="text-xs bg-emerald-50 text-[#113826] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">Directions</span>
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#113826] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#113826]">Operating Hours</h4>
                  <p className="text-sm text-[#55625B]">5:00 AM – 11:00 PM (Everyday)</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-[#113826] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#113826]">Phone & WhatsApp</h4>
                  <p className="text-sm text-[#55625B]">
                    <a href="tel:9863429955" className="hover:underline font-bold text-[#113826]">
                      +91 98634 29955
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F2ECE1]">
              <a
                href="https://wa.me/919863429955?text=Hello%20Keishampat%20Reading%20Space%2C%20I%20have%20an%20inquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 bg-[#113826] hover:bg-[#0B2318] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Chat Instantly on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#EBE5DA] shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#113826]">Send Us a Message</h2>
              <p className="text-sm text-[#55625B] mt-1">
                Fill out the form below and our team will get back to you promptly.
              </p>
            </div>

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 text-sm outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="98634 29955"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 text-sm outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Inquiry Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2C3531] uppercase tracking-wider block">
                  Your Message *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DCD5C8] focus:border-[#113826] focus:ring-2 focus:ring-[#113826]/20 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-[#113826] hover:bg-[#0B2318] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-300" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
