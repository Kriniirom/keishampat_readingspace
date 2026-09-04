/**
 * @file layout.tsx
 * @description Next.js root layout wrapper component incorporating Header, Footer, and global styling.
 */

import React from 'react';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VisitorTracker from '../components/VisitorTracker';

export const metadata = {
  title: 'Keishampat Reading Space - Peaceful & Productive Study Space in Keishampat',
  description: 'Keishampat Reading Space provides 18 dedicated individual study desks, 5 AM to 11 PM timing, high-speed Wi-Fi, silent environment, and CCTV security for ₹900/month.',
  keywords: ['Keishampat Reading Space', 'Study space Imphal', 'Reading room Manipur', 'Library Keishampat', 'Study desk booking'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="flex flex-col min-h-screen antialiased bg-[#F8F6F0]">
        <VisitorTracker />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
