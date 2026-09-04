/**
 * @file VisitorTracker.tsx
 * @description Robust, mobile-optimized automatic visitor tracking component.
 * Immediately logs Date & Time, Page Visited, Device, Approximate City, and Referrer
 * directly into the 'Visitors' tab in your Google Sheet.
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { APPS_SCRIPT_URL } from '../lib/api';

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Mobile (Android)';
  if (/iPhone/i.test(ua)) return 'Mobile (iPhone)';
  if (/iPad/i.test(ua)) return 'Tablet (iPad)';
  if (/Windows/i.test(ua)) return 'Desktop (Windows)';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Desktop (Mac)';
  if (/Linux/i.test(ua)) return 'Desktop (Linux)';
  return 'Mobile Device';
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

function getSafeStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.sessionStorage ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function setSafeStorage(key: string, value: string) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors in strict private/incognito modes
  }
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastLoggedPath.current) return;

    // Avoid multiple duplicate entries on quick re-renders
    const sessionKey = `krs_visit_${pathname}`;
    if (getSafeStorage(sessionKey)) return;

    lastLoggedPath.current = pathname;
    setSafeStorage(sessionKey, '1');

    const sendLog = async () => {
      let approximateCity = 'Imphal / India';

      // 1. Check cached city
      const cached = getSafeStorage('krs_city');
      if (cached) {
        approximateCity = cached;
      } else {
        // 2. Quick non-blocking IP check (max 1.2s timeout so mobile never hangs)
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1200);
          const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const c = data.city || '';
            const r = data.region || data.region_code || '';
            approximateCity = c ? `${c}${r ? `, ${r}` : ''}` : (data.country_name || 'India');
            setSafeStorage('krs_city', approximateCity);
          }
        } catch {
          // Fallback based on timezone
          try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz && tz.includes('Kolkata')) {
              approximateCity = 'India (IST)';
            }
          } catch {}
        }
      }

      const payload = {
        action: 'logVisit',
        page: pathname,
        device: getDeviceType(),
        city: approximateCity,
        cameFrom: getReferrerSource(),
        timestamp: new Date().toISOString(),
      };

      try {
        // Use keepalive: true so mobile browsers don't drop request on backgrounding
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch (err) {
        // Fallback with navigator.sendBeacon for mobile if fetch fails
        try {
          if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            navigator.sendBeacon(APPS_SCRIPT_URL, JSON.stringify(payload));
          }
        } catch {}
      }
    };

    // Small 200ms delay to allow page hydration to finish smoothly on mobile
    const timeout = setTimeout(sendLog, 200);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
