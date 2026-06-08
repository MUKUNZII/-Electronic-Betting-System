const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query(
      'SELECT id, full_name, username, email, role, is_active, is_verified FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users.length) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!users[0].is_active) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const [admins] = await pool.query(
      'SELECT id, full_name, username, email, is_active FROM admins WHERE id = ?',
      [decoded.id]
    );

    if (!admins.length) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    if (!admins[0].is_active) {
      return res.status(403).json({ success: false, message: 'Admin account disabled' });
    }

    req.admin = admins[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [users] = await pool.query('SELECT id, full_name, username, email, role FROM users WHERE id = ?', [decoded.id]);
      if (users.length) req.user = users[0];
    }
  } catch { /* ignore — optional */ }
  next();
};

module.exports = { authenticateToken, authenticateAdmin, optionalAuth };
