const Transaction = require('../models/Transaction');

// Get user's transaction history
const getTransactions = async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;

    const filter = { user: req.user._id };
    if (type) {
      filter.type = type;
    }

    const transactions = await Transaction.find(filter)
      .populate('relatedTask', 'title')
      .populate('relatedPackage', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          status: { $ne: 'cancelled' } // Exclude cancelled transactions (rejected withdrawals)
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      taskRewards: { total: 0, count: 0 },
      referralBonus: { total: 0, count: 0 },
      packagePurchases: { total: 0, count: 0 },
      withdrawals: { total: 0, count: 0 }
    };

    stats.forEach(stat => {
      switch (stat._id) {
        case 'task_reward':
          formattedStats.taskRewards = { total: stat.total, count: stat.count };
          break;
        case 'referral_bonus':
          formattedStats.referralBonus = { total: stat.total, count: stat.count };
          break;
        case 'package_purchase':
          formattedStats.packagePurchases = { total: stat.total, count: stat.count };
          break;
        case 'withdrawal':
          formattedStats.withdrawals = { total: Math.abs(stat.total), count: stat.count };
          break;
      }
    });

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  getTransactionStats
};
