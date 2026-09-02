/**
 * @file planRoutes.js
 * @description Express Router for membership plans and pricing details.
 */

const express = require('express');
const router = express.Router();
const { getPlans } = require('../controllers/planController');

// GET /api/plans - Fetch list of pricing & membership packages
router.get('/plans', getPlans);

module.exports = router;
