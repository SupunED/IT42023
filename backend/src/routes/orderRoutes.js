const express = require('express');
const router = express.Router();
const { checkout, trackOrder, getUserOrders } = require('../controllers/orderController');
const { optionalAuth, authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const trackingLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many tracking attempts. Please try again later.' }
});

router.post('/checkout', optionalAuth, checkout);
router.get('/track', trackingLimit, optionalAuth, trackOrder);
router.post('/track', trackingLimit, optionalAuth, trackOrder);
router.get('/my-orders', authenticate, getUserOrders);

module.exports = router;
