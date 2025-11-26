const express = require('express');
const router = express.Router();
const {
  requestWithdrawal,
  getWithdrawals
} = require('../controllers/withdrawalController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, requestWithdrawal);
router.get('/', protect, getWithdrawals);

module.exports = router;
