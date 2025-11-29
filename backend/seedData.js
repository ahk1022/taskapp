const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Package = require('./models/Package');

dotenv.config();

const packages = [
  {
    name: 'Basic Package',
    price: 500,
    description: 'Perfect for beginners who want to start earning',
    tasksPerDay: 3,
    rewardPerTask: 10,
    totalDays: 90,
    totalEarnings: 2700,
    features: [
      '3 tasks per day',
      '10 rupees per task',
      '90 days validity',
      'Total earnings: 2700 rupees',
      'Profit: 2200 rupees'
    ]
  },
  {
    name: 'Silver Package',
    price: 1000,
    description: 'Great value package for regular users',
    tasksPerDay: 6,
    rewardPerTask: 10,
    totalDays: 90,
    totalEarnings: 5400,
    features: [
      '6 tasks per day',
      '10 rupees per task',
      '90 days validity',
      'Total earnings: 5400 rupees',
      'Profit: 4400 rupees'
    ]
  },
  {
    name: 'Gold Package',
    price: 2000,
    description: 'Premium package for serious earners',
    tasksPerDay: 12,
    rewardPerTask: 10,
    totalDays: 90,
    totalEarnings: 10800,
    features: [
      '12 tasks per day',
      '10 rupees per task',
      '90 days validity',
      'Total earnings: 10800 rupees',
      'Profit: 8800 rupees'
    ]
  },
  {
    name: 'Platinum Package',
    price: 3500,
    description: 'Ultimate package for maximum earnings',
    tasksPerDay: 21,
    rewardPerTask: 10,
    totalDays: 90,
    totalEarnings: 18900,
    features: [
      '21 tasks per day',
      '10 rupees per task',
      '90 days validity',
      'Total earnings: 18900 rupees',
      'Profit: 15400 rupees'
    ]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Clear existing packages and insert new ones
    await Package.deleteMany({});

    // Insert packages
    const createdPackages = await Package.insertMany(packages);
    console.log(`✓ Created ${createdPackages.length} packages`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
