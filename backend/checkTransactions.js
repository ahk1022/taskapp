const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Transaction = require('./models/Transaction');
const Withdrawal = require('./models/Withdrawal');

dotenv.config();

const checkTransactions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all withdrawals with their transactions
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }).limit(5);

    for (const withdrawal of withdrawals) {
      console.log(`\n=== Withdrawal ${withdrawal._id} ===`);
      console.log(`Status: ${withdrawal.status}`);
      console.log(`Amount: ₨${withdrawal.amount}`);
      console.log(`Created: ${withdrawal.createdAt}`);

      // Find related transactions (within 2 seconds)
      const transactions = await Transaction.find({
        user: withdrawal.user,
        type: 'withdrawal',
        createdAt: {
          $gte: new Date(withdrawal.createdAt.getTime() - 2000),
          $lte: new Date(withdrawal.createdAt.getTime() + 2000)
        }
      }).sort({ createdAt: 1 });

      console.log(`\nRelated Transactions (${transactions.length}):`);
      transactions.forEach((t, i) => {
        console.log(`  ${i + 1}. Amount: ₨${t.amount}, Status: ${t.status}, Description: ${t.description}`);
      });

      if (withdrawal.status === 'rejected' && transactions.some(t => t.status !== 'cancelled')) {
        console.log(`  ⚠️  WARNING: Withdrawal is rejected but some transactions are not cancelled!`);
      }
    }

    // Check for withdrawal transactions that are not cancelled
    const activeWithdrawals = await Transaction.countDocuments({
      type: 'withdrawal',
      status: { $ne: 'cancelled' }
    });

    console.log(`\n\nTotal active withdrawal transactions: ${activeWithdrawals}`);

    process.exit(0);
  } catch (error) {
    console.error('Error checking transactions:', error);
    process.exit(1);
  }
};

checkTransactions();
