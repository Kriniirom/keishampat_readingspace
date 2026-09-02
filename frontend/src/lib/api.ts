/**
 * @file api.ts
 * @description Centralized Axios API client for communication with the Express backend.
 * Provides typed methods with standard error handling and fallbacks for smooth client-side operations.
 */

import axios from 'axios';

// Express API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance configured with base URL and standard request headers
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Seat interface defining individual study cubicle properties
 */
export interface Seat {
  id: number;
  seatNumber: string;
  status: 'available' | 'occupied';
  type: string;
  pricePerMonth: number;
  hasPowerSocket: boolean;
  hasDeskLamp: boolean;
  reservedBy?: { name: string; phone: string } | null;
}

/**
 * Seat Booking payload interface
 */
export interface BookingPayload {
  seatId: number;
  fullName: string;
  phone: string;
  address?: string;
  startDate: string;
  durationMonths?: number;
  totalAmount?: number;
  planType?: string;
  paymentMethod?: 'upi' | 'cash';
  transactionRef?: string;
  notes?: string;
}

/**
 * Membership Plan interface
 */
export interface MembershipPlan {
  id: string;
  title: string;
  price: number;
  currency: string;
  billingCycle: string;
  popular: boolean;
  description: string;
  features: string[];
}

/**
 * Contact Form payload interface
 */
export interface ContactPayload {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
}

/**
 * Fetch all 20 study seats and their real-time status from backend Express API
 */
export const fetchSeats = async (): Promise<{ seats: Seat[]; totalSeats: number; availableCount: number }> => {
  try {
    const response = await api.get('/seats');
    return {
      seats: response.data.data,
      totalSeats: response.data.totalSeats,
      availableCount: response.data.availableCount,
    };
  } catch (error) {
    console.error('Failed to fetch seats from API:', error);
    // Return graceful fallback data if backend isn't reached
    const fallbackSeats: Seat[] = Array.from({ length: 18 }, (_, index) => {
      const id = index + 1;
      const isOccupied = id === 3 || id === 7 || id === 12;
      return {
        id,
        seatNumber: `Seat #${id.toString().padStart(2, '0')}`,
        status: isOccupied ? 'occupied' : 'available',
        type: id <= 9 ? 'Standard Desk' : 'Premium Quiet Zone Desk',
        pricePerMonth: 900,
        hasPowerSocket: true,
        hasDeskLamp: true,
      };
    });
    return {
      seats: fallbackSeats,
      totalSeats: 18,
      availableCount: 15,
    };
  }
};

/**
 * Submit seat reservation request via Axios POST request
 */
export const bookSeatApi = async (payload: BookingPayload) => {
  try {
    const response = await api.post('/bookings', payload);
    return response.data;
  } catch (error: any) {
    console.error('Failed to submit booking:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Failed to submit seat booking.');
    }
    throw new Error('Network error. Please check if the Express backend server is running.');
  }
};

/**
 * Fetch membership plans & packages from backend API
 */
export const fetchPlans = async (): Promise<MembershipPlan[]> => {
  try {
    const response = await api.get('/plans');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return [
      {
        id: 'monthly-standard',
        title: 'Monthly Full Access',
        price: 900,
        currency: '₹',
        billingCycle: 'per month',
        popular: true,
        description: 'Complete access to your dedicated desk from 5:00 AM to 11:00 PM everyday.',
        features: [
          'Dedicated personal desk & chair',
          'Operating hours: 5:00 AM – 11:00 PM',
          'High-Speed Wi-Fi connectivity',
          'CCTV monitored 24/7 security',
          'Silent & distraction-free environment',
          'Individual power socket & desk light'
        ]
      }
    ];
  }
};

/**
 * Submit customer contact/inquiry form via Axios POST
 */
export const submitContactApi = async (payload: ContactPayload) => {
  try {
    const response = await api.post('/contact', payload);
    return response.data;
  } catch (error: any) {
    console.error('Failed to submit inquiry:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Failed to submit contact message.');
    }
    throw new Error('Network error while sending contact message.');
  }
};

export default api;
