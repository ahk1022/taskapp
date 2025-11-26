const express = require('express');
const router = express.Router();
const {
  getPackages,
  getPackage,
  purchasePackage,
  createPackage
} = require('../controllers/packageController');
const { protect } = require('../middleware/auth');
const { checkAdmin } = require('../middleware/admin');

router.get('/', getPackages);
router.get('/:id', getPackage);
router.post('/purchase', protect, purchasePackage);
router.post('/create', protect, checkAdmin, createPackage);

module.exports = router;
