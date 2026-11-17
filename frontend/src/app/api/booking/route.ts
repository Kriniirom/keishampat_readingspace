import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const allowed = new Set(['seats', 'createBooking', 'lookup', 'renewBooking', 'reportPayment', 'contactInquiry']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!allowed.has(body.action)) return NextResponse.json({ success: false, error: 'Unsupported request.' }, { status: 400 });
    const url = process.env.APPS_SCRIPT_URL;
    const secret = process.env.APPS_SCRIPT_SECRET;
    if (!url || !secret) return NextResponse.json({ success: false, error: 'Online booking is being configured. Please contact reception before paying.' }, { status: 503 });
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...body, apiSecret: secret }),
      cache: 'no-store', signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok || result.protocol !== 2 || typeof result.success !== 'boolean') throw new Error('Invalid upstream response');
    return NextResponse.json(result, { status: result.success ? 200 : 400, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'We could not confirm the result. Please retry the same request or check your booking status. Do not pay again.' }, { status: 502 });
  }
}
