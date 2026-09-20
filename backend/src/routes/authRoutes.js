const express = require('express');
const router = express.Router();
const { googleAuth, logout, getProfile, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

router.use((req, res, next) => {
	res.set('Cache-Control', 'no-store');
	next();
});
router.post('/google', rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many sign-in attempts. Please try again later.' }
}), googleAuth);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
