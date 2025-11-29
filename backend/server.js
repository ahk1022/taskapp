const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { initTaskCleanupCron } = require('./cron/taskCleanup');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize cron jobs
initTaskCleanupCron();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/withdrawals', require('./routes/withdrawalRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Task Reward Investment App API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      packages: '/api/packages',
      tasks: '/api/tasks',
      withdrawals: '/api/withdrawals',
      transactions: '/api/transactions'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle payload too large error
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'File too large. Please upload an image smaller than 2MB.'
    });
  }

  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
