const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, signup, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], login);

// POST /api/auth/signup
router.post('/signup', [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').notEmpty().withMessage('Full name is required')
], signup);

// GET /api/auth/profile
router.get('/profile', protect, getMe);

// PUT /api/auth/change-password
router.put('/change-password', protect, changePassword);

module.exports = router;
