const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionStats
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTransactions);
router.get('/stats', protect, getTransactionStats);

module.exports = router;
