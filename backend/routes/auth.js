const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/auth');
const {
  register, login, adminLogin, verifyEmail,
  forgotPassword, resetPassword, getMe, resendVerification,
} = require('../controllers/authController');

router.post('/register', authLimiter, [
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 100 }),
  body('username').trim().notEmpty().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, underscores'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('confirm_password').custom((val, { req }) => { if (val !== req.body.password) throw new Error('Passwords do not match'); return true; }),
], validate, register);

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, login);

router.post('/admin/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, adminLogin);

router.get('/verify-email', verifyEmail);

router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail(),
], validate, forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], validate, resetPassword);

router.get('/me', authenticateToken, getMe);

router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], validate, resendVerification);

module.exports = router;
