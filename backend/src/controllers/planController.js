/**
 * @file planController.js
 * @description Controller for fetching reading space membership plans and pricing details.
 */

const { plans } = require('../data/db');

/**
 * Get all available membership plans
 * @route GET /api/plans
 */
const getPlans = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving membership plans.'
    });
  }
};

module.exports = {
  getPlans
};
