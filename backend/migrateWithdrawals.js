const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Withdrawal = require('./models/Withdrawal');

dotenv.config();

const migrateWithdrawals = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all withdrawals that don't have tax fields
    const withdrawals = await Withdrawal.find({
      $or: [
        { taxAmount: { $exists: false } },
        { taxAmount: null },
        { netAmount: { $exists: false } },
        { netAmount: null }
      ]
    });

    console.log(`Found ${withdrawals.length} withdrawals to migrate`);

    if (withdrawals.length === 0) {
      console.log('No withdrawals need migration. All withdrawals already have tax fields.');
      process.exit(0);
    }

    let updated = 0;
    const taxPercentage = 12;

    for (const withdrawal of withdrawals) {
      // Calculate tax (12%)
      const taxAmount = Math.round(withdrawal.amount * (taxPercentage / 100));
      const netAmount = withdrawal.amount - taxAmount;

      // Update the withdrawal
      withdrawal.taxPercentage = taxPercentage;
      withdrawal.taxAmount = taxAmount;
      withdrawal.netAmount = netAmount;

      await withdrawal.save();
      updated++;

      console.log(`✓ Updated withdrawal ${withdrawal._id}:`);
      console.log(`  Amount: ₨${withdrawal.amount}`);
      console.log(`  Tax (${taxPercentage}%): ₨${taxAmount}`);
      console.log(`  Net: ₨${netAmount}`);
    }

    console.log(`\n✓ Successfully migrated ${updated} withdrawals`);
    console.log('All withdrawals now have tax calculations applied!');

    process.exit(0);
  } catch (error) {
    console.error('Error migrating withdrawals:', error);
    process.exit(1);
  }
};

migrateWithdrawals();
