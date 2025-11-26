const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const addDemoBalance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create demo user
    let demoUser = await User.findOne({ email: 'demo@example.com' });

    if (!demoUser) {
      console.log('Demo user not found. Creating new demo user...');

      // Generate unique referral code
      const referralCode = 'DEMO' + Date.now();

      demoUser = await User.create({
        username: 'demo',
        email: 'demo@example.com',
        password: 'demo123', // Will be hashed by pre-save hook
        phone: '03001234567',
        referralCode: referralCode,
        wallet: {
          balance: 3000,
          earnings: 0,
          referralEarnings: 0
        },
        isActive: true,
        isAdmin: false
      });

      console.log('✓ Created new demo user with 3000 RS');
      console.log('  Email: demo@example.com');
      console.log('  Password: demo123');
      console.log('  Balance: ₨3000');
    } else {
      // Update existing demo user balance
      demoUser.wallet.balance = 3000;
      await demoUser.save();

      console.log('✓ Updated existing demo user balance to 3000 RS');
      console.log('  Email:', demoUser.email);
      console.log('  Username:', demoUser.username);
      console.log('  New Balance: ₨3000');
    }

    console.log('\nDemo account ready to use!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding demo balance:', error);
    process.exit(1);
  }
};

addDemoBalance();
