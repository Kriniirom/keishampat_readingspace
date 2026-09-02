/**
 * @file bookingController.js
 * @description Controller logic for seat fetching and booking management.
 * Follows SOLID single-responsibility principles with full error handling.
 */

const { seats, bookings } = require('../data/db');

/**
 * Get list of all 20 seats with status
 * @route GET /api/seats
 */
const getAllSeats = (req, res) => {
  try {
    // Return complete list of seats
    return res.status(200).json({
      success: true,
      totalSeats: seats.length,
      availableCount: seats.filter((s) => s.status === 'available').length,
      data: seats
    });
  } catch (error) {
    console.error('Error fetching seats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving seat status.'
    });
  }
};

/**
 * Reserve/Book a specific seat by Seat ID
 * @route POST /api/bookings
 */
const createBooking = (req, res) => {
  try {
    const { seatId, fullName, phone, address, startDate, durationMonths, totalAmount, planType, paymentMethod, transactionRef, notes } = req.body;

    // Validate required fields
    if (!seatId || !fullName || !phone || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide seatId, fullName, phone, and startDate.'
      });
    }

    // Find requested seat in database
    const seat = seats.find((s) => s.id === Number(seatId));

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: `Seat #${seatId} not found.`
      });
    }

    if (seat.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: `Seat #${seatId} is already occupied. Please select another seat.`
      });
    }

    const duration = Number(durationMonths) || 1;
    const finalPrice = Number(totalAmount) || (seat.pricePerMonth * duration);

    // Create booking record
    const isCash = paymentMethod === 'cash';
    const newBooking = {
      id: `BK-${Date.now()}`,
      seatId: seat.id,
      seatNumber: seat.seatNumber,
      fullName,
      phone,
      address: address || '',
      startDate,
      durationMonths: duration,
      totalAmount: finalPrice,
      planType: planType || `${duration} Month Subscription (₹${finalPrice})`,
      paymentMethod: isCash ? 'Cash at Counter' : 'UPI Payment',
      transactionRef: transactionRef || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      status: 'Confirmed'
    };

    // Update seat state to occupied
    seat.status = 'occupied';
    seat.reservedBy = { name: fullName, phone };

    // Push to bookings log
    bookings.push(newBooking);

    const successMsg = isCash
      ? `Booking submitted for ${seat.seatNumber}! Please inform the receptionist at the counter in person OR send a message on WhatsApp (+91 98634 29955) after giving the cash for verification.`
      : `Successfully booked ${seat.seatNumber}! We look forward to welcoming you at Keishampat Reading Space.`;

    return res.status(201).json({
      success: true,
      message: successMsg,
      booking: newBooking
    });
  } catch (error) {
    console.error('Error processing booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating booking.'
    });
  }
};

module.exports = {
  getAllSeats,
  createBooking
};
