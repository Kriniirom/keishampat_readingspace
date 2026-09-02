/**
 * @file contactController.js
 * @description Controller for managing customer inquiry submissions.
 */

const { inquiries } = require('../data/db');

/**
 * Handle new contact form submissions
 * @route POST /api/contact
 */
const submitContactForm = (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    // Validate minimal required inputs
    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, phone number, and message.'
      });
    }

    const newInquiry = {
      id: `INQ-${Date.now()}`,
      name,
      phone,
      email: email || '',
      subject: subject || 'General Inquiry',
      message,
      submittedAt: new Date().toISOString()
    };

    inquiries.push(newInquiry);

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Our team at Keishampat Reading Space will contact you shortly.',
      inquiry: newInquiry
    });
  } catch (error) {
    console.error('Error handling contact submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting your message.'
    });
  }
};

/**
 * Get list of all submitted inquiries (Admin API)
 * @route GET /api/contact
 */
const getInquiries = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving inquiries.'
    });
  }
};

module.exports = {
  submitContactForm,
  getInquiries
};
