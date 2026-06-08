const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Generate referral code
const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { full_name, username, email, phone, date_of_birth, country, password, referral_code } = req.body;

    // Check existing user
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email or username already exists' });
    }

    // Handle referral
    let referredBy = null;
    if (referral_code) {
      const [referrer] = await pool.query('SELECT id FROM users WHERE referral_code = ?', [referral_code]);
      if (referrer.length) referredBy = referrer[0].id;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const myReferralCode = generateReferralCode();

    const [result] = await pool.query(
      `INSERT INTO users (full_name, username, email, phone, date_of_birth, country, password, referral_code, referred_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, username, email, phone || null, date_of_birth || null, country || null, hashedPassword, myReferralCode, referredBy]
    );

    const userId = result.insertId;

    // Create wallet
    await pool.query('INSERT INTO wallets (user_id) VALUES (?)', [userId]);

    // Referral bonus
    if (referredBy) {
      await pool.query(
        'UPDATE wallets SET balance = balance + 10.00, total_deposited = total_deposited + 10.00 WHERE user_id = ?',
        [referredBy]
      );
      await createNotification(referredBy, 'Referral Bonus!', `You earned $10 bonus for referring a new user!`, 'bonus');
    }

    // Auto-verify in development mode OR send verification email
    if (process.env.DEV_AUTO_VERIFY === 'true') {
      // Instantly mark email as verified — no SMTP needed in dev
      await pool.query('UPDATE users SET is_verified = 1 WHERE id = ?', [userId]);
      await createNotification(userId, 'Welcome!', `Welcome to Electronic Betting System, ${full_name}! Your account is ready.`, 'system');
    } else {
      // Send real verification email
      const verifyToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, verifyToken, expiresAt]
      );
      const emailResult = await sendVerificationEmail(email, verifyToken, full_name);
      if (!emailResult.success) {
        console.error('⚠️  Verification email failed:', emailResult.error);
      }
      await createNotification(userId, 'Welcome!', `Welcome to Electronic Betting System, ${full_name}! Please verify your email.`, 'system');
    }

    const token = generateToken({ id: userId, email, role: 'user' });
    const isVerified = process.env.DEV_AUTO_VERIFY === 'true' ? 1 : 0;
    const message = isVerified
      ? 'Registration successful. Welcome!'
      : 'Registration successful. Please verify your email.';

    res.status(201).json({
      success: true,
      message,
      token,
      user: { id: userId, full_name, username, email, is_verified: isVerified, referral_code: myReferralCode },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      'SELECT id, full_name, username, email, password, role, is_active, is_verified, profile_photo, referral_code FROM users WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: 'user' });

    // Get wallet
    const [wallets] = await pool.query('SELECT balance FROM wallets WHERE user_id = ?', [user.id]);
    const balance = wallets.length ? wallets[0].balance : 0;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        profile_photo: user.profile_photo,
        referral_code: user.referral_code,
        balance,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// POST /api/auth/admin/login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [admins] = await pool.query(
      'SELECT id, full_name, username, email, password, is_active FROM admins WHERE email = ?',
      [email]
    );

    if (!admins.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = admins[0];
    if (!admin.is_active) {
      return res.status(403).json({ success: false, message: 'Admin account disabled' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken({ id: admin.id, email: admin.email, role: 'admin' });

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: { id: admin.id, full_name: admin.full_name, username: admin.username, email: admin.email },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// GET /api/auth/verify-email?token=xxx
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const [rows] = await pool.query(
      'SELECT * FROM email_verifications WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }

    await pool.query('UPDATE users SET is_verified = 1 WHERE id = ?', [rows[0].user_id]);
    await pool.query('DELETE FROM email_verifications WHERE id = ?', [rows[0].id]);

    res.json({ success: true, message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await pool.query('SELECT id, full_name FROM users WHERE email = ?', [email]);

    // Always return success to prevent email enumeration
    if (!users.length) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt]
    );

    sendPasswordResetEmail(email, token, users[0].full_name).catch(console.error);

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = 0',
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, rows[0].email]);
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [rows[0].id]);

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.email, u.phone, u.date_of_birth, u.country,
              u.profile_photo, u.is_verified, u.is_active, u.referral_code, u.created_at,
              w.balance, w.total_deposited, w.total_winnings, w.total_losses, w.total_withdrawn
       FROM users u
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT id, full_name, is_verified FROM users WHERE email = ?', [email]);

    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });
    if (users[0].is_verified) return res.status(400).json({ success: false, message: 'Email already verified' });

    await pool.query('DELETE FROM email_verifications WHERE user_id = ?', [users[0].id]);

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query('INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)', [users[0].id, token, expiresAt]);

    sendVerificationEmail(email, token, users[0].full_name).catch(console.error);

    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resend verification' });
  }
};

module.exports = { register, login, adminLogin, verifyEmail, forgotPassword, resetPassword, getMe, resendVerification };
