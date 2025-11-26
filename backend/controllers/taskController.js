const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get available tasks for user
const getAvailableTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('currentPackage');

    if (!user.currentPackage) {
      return res.status(403).json({ message: 'Please purchase a package to access tasks' });
    }

    // Get tasks completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksCompletedToday = await UserTask.countDocuments({
      user: user._id,
      status: 'completed',
      completedAt: { $gte: today }
    });

    const tasksRemaining = user.currentPackage.tasksPerDay - tasksCompletedToday;

    if (tasksRemaining <= 0) {
      return res.json({
        tasks: [],
        message: 'Daily task limit reached',
        tasksCompletedToday,
        tasksAllowed: user.currentPackage.tasksPerDay
      });
    }

    // Get all active tasks
    const allTasks = await Task.find({ isActive: true });

    // Get tasks already completed by user today
    const completedTaskIds = await UserTask.find({
      user: user._id,
      completedAt: { $gte: today }
    }).distinct('task');

    // Filter out completed tasks
    const availableTasks = allTasks.filter(
      task => !completedTaskIds.some(id => id.equals(task._id))
    );

    res.json({
      tasks: availableTasks,
      tasksCompletedToday,
      tasksAllowed: user.currentPackage.tasksPerDay,
      tasksRemaining,
      rewardPerTask: user.currentPackage.rewardPerTask
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a task
const startTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    const user = await User.findById(req.user._id).populate('currentPackage');

    if (!user.currentPackage) {
      return res.status(403).json({ message: 'No active package' });
    }

    const task = await Task.findById(taskId);
    if (!task || !task.isActive) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksCompletedToday = await UserTask.countDocuments({
      user: user._id,
      status: 'completed',
      completedAt: { $gte: today }
    });

    if (tasksCompletedToday >= user.currentPackage.tasksPerDay) {
      return res.status(403).json({ message: 'Daily task limit reached' });
    }

    // Check if task already in progress or completed today
    const existingUserTask = await UserTask.findOne({
      user: user._id,
      task: task._id,
      createdAt: { $gte: today }
    });

    if (existingUserTask) {
      return res.status(400).json({ message: 'Task already started or completed today' });
    }

    const userTask = await UserTask.create({
      user: user._id,
      task: task._id,
      status: 'in_progress',
      reward: user.currentPackage.rewardPerTask
    });

    res.json({
      userTask,
      task,
      reward: user.currentPackage.rewardPerTask
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete a task
const completeTask = async (req, res) => {
  try {
    const { userTaskId } = req.body;

    const userTask = await UserTask.findById(userTaskId).populate('task');

    if (!userTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (userTask.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (userTask.status === 'completed') {
      return res.status(400).json({ message: 'Task already completed' });
    }

    // Update task status
    userTask.status = 'completed';
    userTask.completedAt = new Date();
    await userTask.save();

    // Update user wallet and stats
    const user = await User.findById(req.user._id);
    user.wallet.balance += userTask.reward;
    user.wallet.earnings += userTask.reward;
    user.tasksCompleted += 1;
    await user.save();

    // Create transaction
    await Transaction.create({
      user: user._id,
      type: 'task_reward',
      amount: userTask.reward,
      status: 'completed',
      description: `Reward for completing: ${userTask.task.title}`,
      relatedTask: userTask.task._id
    });

    res.json({
      message: 'Task completed successfully',
      reward: userTask.reward,
      newBalance: user.wallet.balance,
      userTask
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's task history
const getTaskHistory = async (req, res) => {
  try {
    const history = await UserTask.find({ user: req.user._id })
      .populate('task')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create task (Admin only)
const createTask = async (req, res) => {
  try {
    const { title, description, type, url, duration, isActive } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const task = await Task.create({
      title,
      description,
      type,
      url,
      duration,
      isActive
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: error.message || 'Failed to create task' });
  }
};

// Get all tasks (Admin)
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task (Admin only)
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, type, url, duration, isActive } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Validation
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }
    if (description !== undefined && !description.trim()) {
      return res.status(400).json({ message: 'Description cannot be empty' });
    }

    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (type) task.type = type;
    if (url !== undefined) task.url = url;
    if (duration !== undefined) task.duration = duration;
    if (isActive !== undefined) task.isActive = isActive;

    await task.save();

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: error.message || 'Failed to update task' });
  }
};

// Delete task (Admin only)
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle task active status (Admin only)
const toggleTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.isActive = !task.isActive;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAvailableTasks,
  startTask,
  completeTask,
  getTaskHistory,
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  toggleTaskStatus
};
