const express = require('express');
const router = express.Router();
const { requestLending, getUserLendings, initiateReturn } = require('../controllers/lendingController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/request', requestLending);
router.get('/my-lendings', getUserLendings);
router.post('/:lendID/return', initiateReturn);

module.exports = router;
