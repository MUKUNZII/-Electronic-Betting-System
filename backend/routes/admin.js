const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticateAdmin } = require('../middleware/auth');
const {
  getDashboard, getUsers, toggleUserStatus, deleteUser,
  getDeposits, approveDeposit, rejectDeposit,
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
  createEvent, updateEvent, setEventResult, deleteEvent,
  getAllBets, createPromoCode, getPromoCodes,
  getRevenue, withdrawRevenue, getRevenueHistory,
} = require('../controllers/adminController');

router.use(authenticateAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Users
router.get('/users', getUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Deposits
router.get('/deposits', getDeposits);
router.put('/deposits/:id/approve', approveDeposit);
router.put('/deposits/:id/reject', rejectDeposit);

// Withdrawals
router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/approve', approveWithdrawal);
router.put('/withdrawals/:id/reject', rejectWithdrawal);

// Events
router.post('/events', [
  body('title').trim().notEmpty().isLength({ min: 3, max: 200 }),
  body('category').isIn(['Football','Basketball','Tennis','Cricket','Baseball','Hockey','Boxing','MMA','Rugby','Golf','Other']),
  body('team_a').trim().notEmpty(),
  body('team_b').trim().notEmpty(),
  body('odds_a').isFloat({ min: 1.01 }),
  body('odds_b').isFloat({ min: 1.01 }),
  body('start_time').isISO8601(),
  body('end_time').isISO8601(),
], validate, createEvent);

router.put('/events/:id', updateEvent);
router.put('/events/:id/result', [
  body('result').isIn(['team_a','team_b','draw','cancelled']),
], validate, setEventResult);
router.delete('/events/:id', deleteEvent);

// Bets
router.get('/bets', getAllBets);

// Promo codes
router.get('/promo-codes', getPromoCodes);
router.post('/promo-codes', [
  body('code').trim().notEmpty().isLength({ min: 3, max: 50 }),
  body('discount_type').isIn(['percentage','fixed']),
  body('discount_value').isFloat({ min: 0.01 }),
], validate, createPromoCode);

// Revenue withdrawal
router.get('/revenue', getRevenue);
router.get('/revenue/history', getRevenueHistory);
router.post('/revenue/withdraw', [
  body('amount').isFloat({ min: 1000 }).withMessage('Minimum withdrawal is RF 1,000'),
], validate, withdrawRevenue);

module.exports = router;
