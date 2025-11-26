const User = require('../models/User');
const Package = require('../models/Package');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const UserTask = require('../models/UserTask');

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalEarnings = await Transaction.aggregate([
      { $match: { type: 'task_reward' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
    ]);
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const activePackages = await User.countDocuments({ currentPackage: { $ne: null } });

    const recentUsers = await User.find({ isAdmin: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt wallet');

    res.json({
      stats: {
        totalUsers,
        totalEarnings: totalEarnings[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        pendingWithdrawals,
        activePackages
      },
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = { isAdmin: false };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('currentPackage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all withdrawals
const getAllWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = status ? { status } : {};

    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'username email phone wallet')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Withdrawal.countDocuments(query);

    res.json({
      withdrawals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve or reject withdrawal
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { withdrawalId, status, remarks } = req.body;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    const user = await User.findById(withdrawal.user);

    // If rejecting, refund the amount
    if (status === 'rejected' && withdrawal.status === 'pending') {
      user.wallet.balance += withdrawal.amount;
      await user.save();
    }

    withdrawal.status = status;
    withdrawal.remarks = remarks;
    if (status === 'completed' || status === 'rejected') {
      withdrawal.processedAt = new Date();
    }
    await withdrawal.save();

    // Update transaction status for both withdrawal and tax transactions
    await Transaction.updateMany(
      {
        user: withdrawal.user,
        type: 'withdrawal',
        createdAt: {
          $gte: new Date(withdrawal.createdAt.getTime() - 1000),
          $lte: new Date(withdrawal.createdAt.getTime() + 1000)
        }
      },
      { status: status === 'rejected' ? 'cancelled' : status }
    );

    res.json({
      message: `Withdrawal ${status}`,
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve package purchase
const approvePackagePurchase = async (req, res) => {
  try {
    const { userId, packageId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    user.currentPackage = packageId;
    user.packagePurchaseDate = new Date();
    await user.save();

    // Update transaction to completed
    await Transaction.findOneAndUpdate(
      {
        user: userId,
        type: 'package_purchase',
        relatedPackage: packageId,
        status: 'pending'
      },
      { status: 'completed' }
    );

    res.json({
      message: 'Package activated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending package purchases
const getPendingPackages = async (req, res) => {
  try {
    const pendingTransactions = await Transaction.find({
      type: 'package_purchase',
      status: 'pending'
    })
      .populate('user', 'username email phone')
      .populate('relatedPackage')
      .sort({ createdAt: -1 });

    res.json(pendingTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;

    const query = type ? { type } : {};

    const transactions = await Transaction.find(query)
      .populate('user', 'username email')
      .populate('relatedPackage', 'name')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllWithdrawals,
  updateWithdrawalStatus,
  approvePackagePurchase,
  getPendingPackages,
  toggleUserStatus,
  getAllTransactions
};
