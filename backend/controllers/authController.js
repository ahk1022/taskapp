const User = require('../models/User');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Generate unique referral code
const generateReferralCode = () => {
  return 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, phone, referralCode } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    // Create user with unique referral code
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = generateReferralCode();
      const existingCode = await User.findOne({ referralCode: newReferralCode });
      if (!existingCode) isUnique = true;
    }

    const user = await User.create({
      username,
      email,
      password,
      phone,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : null
    });

    // If referred, add bonus to referrer
    if (referrer) {
      const referralBonus = parseFloat(process.env.REFERRAL_BONUS) || 10;
      referrer.wallet.balance += referralBonus;
      referrer.wallet.referralEarnings += referralBonus;
      referrer.referralCount += 1;
      await referrer.save();

      // Create transaction for referral bonus
      const Transaction = require('../models/Transaction');
      await Transaction.create({
        user: referrer._id,
        type: 'referral_bonus',
        amount: referralBonus,
        status: 'completed',
        description: `Referral bonus for inviting ${username}`
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      referralCode: user.referralCode,
      wallet: user.wallet,
      isAdmin: user.isAdmin || false,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('currentPackage');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

    // Check if user has a pending package purchase
    let packageStatus = null;
    let currentPackage = user.currentPackage;
    let pendingPackage = null;

    if (user.currentPackage) {
      const pendingTransaction = await Transaction.findOne({
        user: user._id,
        type: 'package_purchase',
        relatedPackage: user.currentPackage._id,
        status: 'pending'
      });

      if (pendingTransaction) {
        packageStatus = 'pending';
        pendingPackage = user.currentPackage;
        currentPackage = null; // Don't show as current until approved
      } else {
        packageStatus = 'approved';
      }
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      referralCode: user.referralCode,
      wallet: user.wallet,
      currentPackage,
      pendingPackage,
      packageStatus,
      tasksCompleted: user.tasksCompleted,
      referralCount: user.referralCount,
      isAdmin: user.isAdmin || false,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('currentPackage');

    // Check if user has a pending package purchase
    let packageStatus = null;
    let currentPackage = user.currentPackage;
    let pendingPackage = null;

    if (user.currentPackage) {
      const pendingTransaction = await Transaction.findOne({
        user: user._id,
        type: 'package_purchase',
        relatedPackage: user.currentPackage._id,
        status: 'pending'
      });

      if (pendingTransaction) {
        packageStatus = 'pending';
        pendingPackage = user.currentPackage;
        currentPackage = null; // Don't show as current until approved
      } else {
        packageStatus = 'approved';
      }
    }

    const userObj = user.toObject();
    res.json({
      ...userObj,
      currentPackage,
      pendingPackage,
      packageStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get referrals
const getReferrals = async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id })
      .select('username email createdAt wallet.earnings tasksCompleted');

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getReferrals
};
