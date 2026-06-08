const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const { placeBetSlip, getBetSlips, getBetSlipStats } = require('../controllers/betSlipController');

router.use(authenticateToken);

router.get('/', getBetSlips);
router.get('/stats', getBetSlipStats);

router.post('/', [
  body('legs').isArray({ min: 1, max: 20 }).withMessage('1–20 selections required'),
  body('legs.*.event_id').isInt({ min: 1 }),
  body('legs.*.selection').isIn(['team_a', 'team_b', 'draw', '1x', 'x2', '12']),
  body('stake').isFloat({ min: 100 }).withMessage('Minimum stake is RF 100'),
], validate, placeBetSlip);

module.exports = router;
