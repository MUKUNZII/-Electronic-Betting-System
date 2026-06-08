const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.email, u.phone, u.date_of_birth, u.country,
              u.profile_photo, u.is_verified, u.referral_code, u.created_at,
              w.balance, w.total_deposited, w.total_winnings, w.total_losses, w.total_withdrawn
       FROM users u LEFT JOIN wallets w ON w.user_id = u.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, date_of_birth, country } = req.body;

    await pool.query(
      'UPDATE users SET full_name = ?, phone = ?, date_of_birth = ?, country = ? WHERE id = ?',
      [full_name, phone || null, date_of_birth || null, country || null, req.user.id]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(current_password, users[0].password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// POST /api/users/upload-photo
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Delete old photo
    const [users] = await pool.query('SELECT profile_photo FROM users WHERE id = ?', [req.user.id]);
    if (users[0]?.profile_photo) {
      const oldPath = path.join(__dirname, '..', users[0].profile_photo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const photoPath = 'uploads/' + req.file.filename;
    await pool.query('UPDATE users SET profile_photo = ? WHERE id = ?', [photoPath, req.user.id]);

    res.json({ success: true, message: 'Photo uploaded successfully', photo: photoPath });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload photo' });
  }
};

// GET /api/users/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const [leaders] = await pool.query(
      `SELECT u.username, u.profile_photo, w.total_winnings,
              COUNT(b.id) as total_bets,
              SUM(CASE WHEN b.status='won' THEN 1 ELSE 0 END) as won_bets
       FROM users u
       JOIN wallets w ON w.user_id = u.id
       LEFT JOIN bets b ON b.user_id = u.id
       WHERE u.is_active = 1
       GROUP BY u.id
       ORDER BY w.total_winnings DESC
       LIMIT 20`
    );
    res.json({ success: true, leaderboard: leaders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, uploadPhoto, getLeaderboard };
