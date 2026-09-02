/**
 * @file bookingRoutes.js
 * @description Express Router for seat endpoints (/api/seats & /api/bookings).
 */

const express = require('express');
const router = express.Router();
const { getAllSeats, createBooking } = require('../controllers/bookingController');

// GET /api/seats - Retrieve 20 study seats availability
router.get('/seats', getAllSeats);

// POST /api/bookings - Reserve a seat
router.post('/bookings', createBooking);

module.exports = router;
