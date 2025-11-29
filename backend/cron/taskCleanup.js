const cron = require('node-cron');
const Task = require('../models/Task');

const initTaskCleanupCron = () => {
  // Run every day at 12:00 AM (midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily task cleanup at:', new Date().toISOString());

    try {
      const result = await Task.deleteMany({});
      console.log(`Deleted ${result.deletedCount} tasks at midnight`);
    } catch (error) {
      console.error('Error during task cleanup:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Change to your timezone if needed
  });

  console.log('Task cleanup cron job initialized - runs daily at 12:00 AM');
};

module.exports = { initTaskCleanupCron };
