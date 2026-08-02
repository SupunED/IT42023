const express = require('express');
const router = express.Router();
const { googleAuth, getProfile, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/google', googleAuth);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
