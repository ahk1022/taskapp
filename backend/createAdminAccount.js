const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdminAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    let admin = await User.findOne({ email: 'admin@taskrewards.com' });

    if (admin) {
      console.log('Admin account already exists!');
      console.log('Email: admin@taskrewards.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create admin account
    admin = await User.create({
      username: 'admin',
      email: 'admin@taskrewards.com',
      password: 'admin123', // Will be hashed automatically
      phone: '0300-0000000',
      referralCode: 'ADMIN2024',
      isAdmin: true,
      wallet: {
        balance: 0,
        earnings: 0,
        referralEarnings: 0
      }
    });

    console.log('\n==========================================');
    console.log('ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('\nLogin Credentials:');
    console.log('Email: admin@taskrewards.com');
    console.log('Password: admin123');
    console.log('\nAdmin Dashboard URL:');
    console.log('http://localhost:3000/admin');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin account:', error.message);
    process.exit(1);
  }
};

createAdminAccount();
