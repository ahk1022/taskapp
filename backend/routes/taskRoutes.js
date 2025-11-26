const express = require('express');
const router = express.Router();
const {
  getAvailableTasks,
  startTask,
  completeTask,
  getTaskHistory,
  createTask,
  getAllTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { checkAdmin } = require('../middleware/admin');

router.get('/available', protect, getAvailableTasks);
router.post('/start', protect, startTask);
router.post('/complete', protect, completeTask);
router.get('/history', protect, getTaskHistory);
router.post('/create', protect, checkAdmin, createTask);
router.get('/all', getAllTasks);

module.exports = router;
