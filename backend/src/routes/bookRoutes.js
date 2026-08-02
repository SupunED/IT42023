const express = require('express');
const router = express.Router();
const { getBooks, getBookById, getCategories, addReview } = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');

router.get('/', getBooks);
router.get('/categories', getCategories);
router.get('/:id', getBookById);
router.post('/:id/reviews', authenticate, addReview);

module.exports = router;
