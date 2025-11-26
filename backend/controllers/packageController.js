const Package = require('../models/Package');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all packages
const getPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single package
const getPackage = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.json(package);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Purchase package (Admin creates, this just assigns to user)
const purchasePackage = async (req, res) => {
  try {
    const { packageId, paymentMethod, paymentProof, transactionId } = req.body;

    // Validate payment proof
    if (!paymentProof && !transactionId) {
      return res.status(400).json({ message: 'Please provide payment proof (image or transaction ID)' });
    }

    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const user = await User.findById(req.user._id);

    // Update user package
    user.currentPackage = package._id;
    user.packagePurchaseDate = new Date();
    await user.save();

    // Create transaction with payment proof
    await Transaction.create({
      user: user._id,
      type: 'package_purchase',
      amount: -package.price,
      status: 'pending', // Will be updated when payment is verified
      description: `Purchased ${package.name} package via ${paymentMethod}`,
      relatedPackage: package._id,
      paymentProof: paymentProof || null,
      transactionId: transactionId || null
    });

    res.json({
      message: 'Package purchase initiated. Please complete payment and submit proof.',
      package: package,
      user: {
        currentPackage: package,
        packagePurchaseDate: user.packagePurchaseDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create package (Admin only - you can add admin middleware later)
const createPackage = async (req, res) => {
  try {
    const { name, price, description, tasksPerDay, rewardPerTask, totalDays, features } = req.body;

    const totalEarnings = tasksPerDay * rewardPerTask * totalDays;

    const package = await Package.create({
      name,
      price,
      description,
      tasksPerDay,
      rewardPerTask,
      totalDays,
      totalEarnings,
      features
    });

    res.status(201).json(package);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPackages,
  getPackage,
  purchasePackage,
  createPackage
};
