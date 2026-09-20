const express = require('express');
const router = express.Router();
const { checkout, trackOrder, getUserOrders } = require('../controllers/orderController');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { paymentStatus, cancelPayment } = require('../controllers/paymentController');
const rateLimit = require('express-rate-limit');
const trackingLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many tracking attempts. Please try again later.' }
});

const checkoutLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const paymentStatusLimit = rateLimit({ windowMs: 60 * 1000, max: 90, standardHeaders: true, legacyHeaders: false });

router.post('/checkout', checkoutLimit, optionalAuth, checkout);
router.post('/payment-status', paymentStatusLimit, paymentStatus);
router.post('/payment-cancel', checkoutLimit, cancelPayment);
router.get('/track', trackingLimit, optionalAuth, trackOrder);
router.post('/track', trackingLimit, optionalAuth, trackOrder);
router.get('/my-orders', authenticate, getUserOrders);

module.exports = router;
