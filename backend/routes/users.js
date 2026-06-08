const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getProfile, updateProfile, changePassword, uploadPhoto, getLeaderboard } = require('../controllers/userController');

router.get('/leaderboard', getLeaderboard);

router.use(authenticateToken);

router.get('/profile', getProfile);

router.put('/profile', [
  body('full_name').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone(),
], validate, updateProfile);

router.put('/change-password', [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], validate, changePassword);

router.post('/upload-photo', upload.single('photo'), uploadPhoto);

module.exports = router;
