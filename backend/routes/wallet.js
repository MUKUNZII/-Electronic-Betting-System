const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const { getWallet, requestDeposit, requestWithdrawal, getTransactions, getDeposits, getWithdrawals } = require('../controllers/walletController');

router.use(authenticateToken);

router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.get('/deposits', getDeposits);
router.get('/withdrawals', getWithdrawals);

router.post('/deposit', [
  body('local_amount').isFloat({ min: 1 }).withMessage('Amount is required'),
  body('sender_phone').notEmpty().withMessage('Sender phone is required'),
  body('payment_method').optional().isIn(['bank_transfer', 'credit_card', 'crypto', 'mobile_money']),
], validate, requestDeposit);

router.post('/withdraw', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount is required'),
  body('payment_method').optional().isIn(['bank_transfer', 'crypto', 'mobile_money']),
], validate, requestWithdrawal);

module.exports = router;
