const { pool } = require('../config/database');

const createNotification = async (userId, title, message, type = 'system') => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

const getUnreadCount = async (userId) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return rows[0].count;
};

module.exports = { createNotification, getUnreadCount };
