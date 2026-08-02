const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, syncCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/items/:cartID', updateCartItem);
router.delete('/items/:cartID', removeFromCart);
router.post('/sync', syncCart);

module.exports = router;
