const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const { placeBet, getUserBets, getBetById, getBetStats } = require('../controllers/betController');

router.use(authenticateToken);

router.get('/', getUserBets);
router.get('/stats', getBetStats);
router.get('/:id', getBetById);

router.post('/', [
  body('event_id').isInt({ min: 1 }).withMessage('Valid event ID required'),
  body('selection').isIn(['team_a', 'team_b', 'draw']).withMessage('Selection must be team_a, team_b, or draw'),
  body('stake').isFloat({ min: 1 }).withMessage('Minimum stake is $1'),
  body('bet_type').optional().isIn(['single', 'multiple']),
], validate, placeBet);

module.exports = router;
