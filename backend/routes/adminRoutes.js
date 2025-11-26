const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllWithdrawals,
  updateWithdrawalStatus,
  approvePackagePurchase,
  getPendingPackages,
  toggleUserStatus,
  getAllTransactions
} = require('../controllers/adminController');
const {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { checkAdmin } = require('../middleware/admin');

// All admin routes require authentication and admin privileges
router.use(protect);
router.use(checkAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.put('/users/toggle-status', toggleUserStatus);

// Withdrawals
router.get('/withdrawals', getAllWithdrawals);
router.put('/withdrawals/update', updateWithdrawalStatus);

// Package purchases
router.get('/packages/pending', getPendingPackages);
router.put('/packages/approve', approvePackagePurchase);

// Transactions
router.get('/transactions', getAllTransactions);

// Tasks
router.get('/tasks', getAllTasks);
router.post('/tasks', createTask);
router.put('/tasks/:taskId', updateTask);
router.delete('/tasks/:taskId', deleteTask);
router.put('/tasks/:taskId/toggle', toggleTaskStatus);

module.exports = router;
