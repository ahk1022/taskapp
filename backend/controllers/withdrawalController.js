const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Request withdrawal
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;

    const user = await User.findById(req.user._id);

    // Check minimum withdrawal amount
    const minWithdrawal = 300; // Minimum 300 rupees
    if (amount < minWithdrawal) {
      return res.status(400).json({
        message: `Minimum withdrawal amount is ${minWithdrawal} rupees`
      });
    }

    // Check if user has sufficient balance
    if (user.wallet.balance < amount) {
      return res.status(400).json({
        message: 'Insufficient balance',
        currentBalance: user.wallet.balance,
        requestedAmount: amount
      });
    }

    // Validate account details
    if (!accountDetails || !accountDetails.accountName) {
      return res.status(400).json({ message: 'Account details are required' });
    }

    // Calculate tax (12%)
    const taxPercentage = 12;
    const taxAmount = Math.round(amount * (taxPercentage / 100));
    const netAmount = amount - taxAmount;

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount,
      taxPercentage,
      taxAmount,
      netAmount,
      method,
      accountDetails,
      status: 'pending'
    });

    // Deduct from user balance (will be refunded if rejected)
    user.wallet.balance -= amount;
    await user.save();

    // Create transaction for withdrawal
    await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount: -netAmount,
      status: 'pending',
      description: `Withdrawal request via ${method}`
    });

    // Create transaction for tax
    await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount: -taxAmount,
      status: 'pending',
      description: `Withdrawal tax (${taxPercentage}%)`
    });

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal,
      newBalance: user.wallet.balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's withdrawal history
const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all withdrawals (Admin only)
const getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const withdrawals = await Withdrawal.find(filter)
      .populate('user', 'username email phone')
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update withdrawal status (Admin only)
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { withdrawalId, status, remarks } = req.body;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    const user = await User.findById(withdrawal.user);

    // If rejecting, refund the amount
    if (status === 'rejected' && withdrawal.status !== 'rejected') {
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
      message: 'Withdrawal status updated',
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestWithdrawal,
  getWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus
};
