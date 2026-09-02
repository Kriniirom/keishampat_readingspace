/**
 * @file db.js
 * @description In-memory data store for Keishampat Reading Space backend.
 * Provides default data for 20 dedicated study seats, membership plans, and contact inquiries.
 */

// Initialize 18 dedicated study seats
const seats = Array.from({ length: 18 }, (_, index) => {
  const seatId = index + 1;
  // Mark a few seats as occupied for realistic status preview
  const isOccupied = seatId === 3 || seatId === 7 || seatId === 12;
  return {
    id: seatId,
    seatNumber: `Seat #${seatId.toString().padStart(2, '0')}`,
    status: isOccupied ? 'occupied' : 'available',
    type: seatId <= 9 ? 'Standard Desk' : 'Premium Quiet Zone Desk',
    pricePerMonth: 900,
    hasPowerSocket: true,
    hasDeskLamp: true,
    reservedBy: isOccupied ? { name: 'Reserved Member', phone: 'XXXXXX' } : null
  };
});

// Membership Plans offered by Keishampat Reading Space
const plans = [
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
  },
  {
    id: 'quarterly-pass',
    title: 'Quarterly Saver Pass',
    price: 2500,
    currency: '₹',
    billingCycle: 'for 3 months',
    popular: false,
    description: 'Discounted 3-month pass for serious long-term exam preparation.',
    features: [
      'Save ₹200 on 3 months booking',
      'Guaranteed seat lock for 90 days',
      'High-Speed Wi-Fi connectivity',
      'CCTV monitored 24/7 security',
      'Silent & distraction-free environment',
      'Priority desk location selection'
    ]
  },
  {
    id: 'daily-flex',
    title: 'Daily Flex Pass',
    price: 60,
    currency: '₹',
    billingCycle: 'per day',
    popular: false,
    description: 'Single day access for quick study sessions or practice exams.',
    features: [
      'Full day desk access (5 AM - 11 PM)',
      'Subject to daily seat availability',
      'High-Speed Wi-Fi connectivity',
      'Quiet environment access'
    ]
  }
];

// Contact form submission storage
const inquiries = [];

// Seat Bookings storage
const bookings = [];

module.exports = {
  seats,
  plans,
  inquiries,
  bookings
};
