const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Withdrawal = require('./models/Withdrawal');

dotenv.config();

const checkWithdrawals = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all withdrawals
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }).limit(10);

    console.log(`Found ${withdrawals.length} recent withdrawals:\n`);

    withdrawals.forEach((w, index) => {
      console.log(`${index + 1}. Withdrawal ${w._id}`);
      console.log(`   Status: ${w.status}`);
      console.log(`   Amount: ₨${w.amount}`);
      console.log(`   Tax Percentage: ${w.taxPercentage || 'NOT SET'}`);
      console.log(`   Tax Amount: ${w.taxAmount ? '₨' + w.taxAmount : 'NOT SET'}`);
      console.log(`   Net Amount: ${w.netAmount ? '₨' + w.netAmount : 'NOT SET'}`);
      console.log(`   Created: ${w.createdAt}`);
      console.log('');
    });

    // Count withdrawals without tax
    const withoutTax = await Withdrawal.countDocuments({
      $or: [
        { taxAmount: { $exists: false } },
        { taxAmount: null }
      ]
    });

    console.log(`\nWithdrawals without tax: ${withoutTax}`);

    process.exit(0);
  } catch (error) {
    console.error('Error checking withdrawals:', error);
    process.exit(1);
  }
};

checkWithdrawals();
