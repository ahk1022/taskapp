const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Package = require('./models/Package');
const Task = require('./models/Task');
const UserTask = require('./models/UserTask');
const Transaction = require('./models/Transaction');

dotenv.config();

const createDemoAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if demo user already exists
    let demoUser = await User.findOne({ email: 'demo@taskrewards.com' });

    if (demoUser) {
      console.log('Demo account already exists!');
      console.log('Email: demo@taskrewards.com');
      console.log('Password: demo123');
      console.log('Referral Code:', demoUser.referralCode);
      process.exit(0);
    }

    // Get the Silver package (or first package if Silver doesn't exist)
    const silverPackage = await Package.findOne({ name: 'Silver Package' }) || await Package.findOne();

    if (!silverPackage) {
      console.log('No packages found. Please run: npm run seed');
      process.exit(1);
    }

    // Create demo user
    demoUser = await User.create({
      username: 'demouser',
      email: 'demo@taskrewards.com',
      password: 'demo123', // Will be hashed automatically
      phone: '0300-1234567',
      referralCode: 'DEMO2024',
      wallet: {
        balance: 500,
        earnings: 300,
        referralEarnings: 200
      },
      currentPackage: silverPackage._id,
      packagePurchaseDate: new Date(),
      tasksCompleted: 15,
      referralCount: 5
    });

    console.log('✓ Demo user created successfully!');

    // Create some referrals for demo user
    const referral1 = await User.create({
      username: 'referred_user1',
      email: 'referred1@example.com',
      password: 'password123',
      phone: '0301-1111111',
      referralCode: 'REF001',
      referredBy: demoUser._id,
      wallet: {
        balance: 150,
        earnings: 150,
        referralEarnings: 0
      },
      tasksCompleted: 10
    });

    const referral2 = await User.create({
      username: 'referred_user2',
      email: 'referred2@example.com',
      password: 'password123',
      phone: '0301-2222222',
      referralCode: 'REF002',
      referredBy: demoUser._id,
      wallet: {
        balance: 200,
        earnings: 200,
        referralEarnings: 0
      },
      tasksCompleted: 8
    });

    console.log('✓ Created 2 referral users');

    // Create some transaction history
    await Transaction.create([
      {
        user: demoUser._id,
        type: 'package_purchase',
        amount: -1000,
        status: 'completed',
        description: 'Purchased Silver Package',
        relatedPackage: silverPackage._id
      },
      {
        user: demoUser._id,
        type: 'task_reward',
        amount: 10,
        status: 'completed',
        description: 'Reward for completing: Watch Advertisement Video'
      },
      {
        user: demoUser._id,
        type: 'task_reward',
        amount: 10,
        status: 'completed',
        description: 'Reward for completing: Visit Sponsor Website'
      },
      {
        user: demoUser._id,
        type: 'referral_bonus',
        amount: 30,
        status: 'completed',
        description: `Referral bonus for inviting ${referral1.username}`
      },
      {
        user: demoUser._id,
        type: 'referral_bonus',
        amount: 30,
        status: 'completed',
        description: `Referral bonus for inviting ${referral2.username}`
      }
    ]);

    console.log('✓ Created transaction history');

    // Get some tasks and mark as completed for demo user
    const tasks = await Task.find().limit(5);
    const today = new Date();

    for (let i = 0; i < Math.min(3, tasks.length); i++) {
      await UserTask.create({
        user: demoUser._id,
        task: tasks[i]._id,
        status: 'completed',
        reward: 10,
        completedAt: new Date(today.getTime() - (i * 3600000)) // Completed at different times
      });
    }

    console.log('✓ Created task completion history');

    console.log('\n==========================================');
    console.log('DEMO ACCOUNT CREATED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('\nLogin Credentials:');
    console.log('Email: demo@taskrewards.com');
    console.log('Password: demo123');
    console.log('\nAccount Details:');
    console.log('Username: demouser');
    console.log('Referral Code: DEMO2024');
    console.log('Current Package: Silver Package');
    console.log('Wallet Balance: ₨500');
    console.log('Total Earnings: ₨300');
    console.log('Referral Earnings: ₨200');
    console.log('Tasks Completed: 15');
    console.log('Referrals: 5');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating demo account:', error.message);
    process.exit(1);
  }
};

createDemoAccount();
