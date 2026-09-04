/**
 * @file VisitorTracker.tsx
 * @description Lightweight, privacy-friendly automatic visitor tracking component.
 * Logs Date & Time, Page Visited, Device, Approximate City, and Referrer (Came From)
 * directly into a 'Visitors' tab in your Google Sheet.
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { APPS_SCRIPT_URL } from '../lib/api';

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Mobile (Android)';
  if (/iPhone/i.test(ua)) return 'Mobile (iPhone)';
  if (/iPad/i.test(ua)) return 'Tablet (iPad)';
  if (/Windows/i.test(ua)) return 'Desktop (Windows)';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Desktop (Mac)';
  if (/Linux/i.test(ua)) return 'Desktop (Linux)';
  return 'Other Device';
}

function getReferrerSource(): string {
  if (typeof document === 'undefined') return 'Direct';
  const ref = document.referrer || '';
  if (!ref) return 'Direct (Link or Bookmark)';
  if (/whatsapp/i.test(ref)) return 'WhatsApp';
  if (/instagram/i.test(ref)) return 'Instagram';
  if (/facebook/i.test(ref)) return 'Facebook';
  if (/google\./i.test(ref)) return 'Google Search';
  if (/t\.co|twitter|x\.com/i.test(ref)) return 'Twitter / X';
  if (/youtube/i.test(ref)) return 'YouTube';
  try {
    const url = new URL(ref);
    return url.hostname;
  } catch {
    return ref.slice(0, 30);
  }
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastLoggedPath.current) return;

    // Prevent logging duplicate hits within the same session
    const sessionKey = `krs_visited_${pathname}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const recordVisit = async () => {
      lastLoggedPath.current = pathname;
      sessionStorage.setItem(sessionKey, 'true');

      let city = 'Detecting...';
      try {
        // Cached city in session
        const cachedCity = sessionStorage.getItem('krs_visitor_city');
        if (cachedCity) {
          city = cachedCity;
        } else {
          // Free, fast IP geolocation lookup with 2.5s timeout
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            const cityName = data.city || '';
            const region = data.region || data.region_code || '';
            city = cityName ? `${cityName}${region ? `, ${region}` : ''}` : (data.country_name || 'India');
            sessionStorage.setItem('krs_visitor_city', city);
          } else {
            city = 'Local / India';
          }
        }
      } catch {
        city = 'Local / India';
      }

      const payload = {
        action: 'logVisit',
        page: pathname,
        device: getDeviceType(),
        city: city || 'Unknown City',
        cameFrom: getReferrerSource(),
        timestamp: new Date().toISOString(),
      };

      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      } catch {
        // Silent fail so it never affects user browsing experience
      }
    };

    recordVisit();
  }, [pathname]);

  return null;
}
