const express = require('express');
const router = express.Router();
const { checkout, trackOrder, getUserOrders } = require('../controllers/orderController');
const { optionalAuth, authenticate } = require('../middleware/auth');

router.post('/checkout', optionalAuth, checkout);
router.get('/track', trackOrder);
router.get('/my-orders', authenticate, getUserOrders);

module.exports = router;
