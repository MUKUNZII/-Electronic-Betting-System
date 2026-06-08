const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');
const { createBooking, loadBooking } = require('../controllers/bookingController');

// Create booking code (optional auth — guests can also book)
router.post('/', optionalAuth, [
  body('legs').isArray({ min: 1, max: 20 }),
  body('legs.*.event_id').isInt({ min: 1 }),
  body('legs.*.selection').isIn(['team_a', 'team_b', 'draw', '1x', 'x2', '12']),
  body('legs.*.odds').isFloat({ min: 1.01 }),
], validate, createBooking);

// Load booking code (public)
router.get('/:code', loadBooking);

module.exports = router;
