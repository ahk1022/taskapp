const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Transaction = require('./models/Transaction');

dotenv.config();

const checkTaxTransactions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all transactions with tax in description
    const taxTransactions = await Transaction.find({
      description: { $regex: /tax/i }
    }).sort({ createdAt: -1 });

    console.log(`Found ${taxTransactions.length} tax transactions:\n`);

    taxTransactions.forEach((t, i) => {
      console.log(`${i + 1}. Amount: ₨${t.amount}, Status: ${t.status}`);
      console.log(`   Description: ${t.description}`);
      console.log(`   Created: ${t.createdAt}`);
      console.log('');
    });

    // Count all withdrawal transactions
    const allWithdrawalTransactions = await Transaction.find({
      type: 'withdrawal'
    }).countDocuments();

    console.log(`\nTotal withdrawal transactions: ${allWithdrawalTransactions}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkTaxTransactions();
