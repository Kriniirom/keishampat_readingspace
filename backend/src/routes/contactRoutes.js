/**
 * @file contactRoutes.js
 * @description Express Router for handling customer inquiries.
 */

const express = require('express');
const router = express.Router();
const { submitContactForm, getInquiries } = require('../controllers/contactController');

// POST /api/contact - Submit contact form
router.post('/contact', submitContactForm);

// GET /api/contact - List all inquiries
router.get('/contact', getInquiries);

module.exports = router;
