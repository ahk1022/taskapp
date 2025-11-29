const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Package = require('./models/Package');
const Task = require('./models/Task');

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

const tasks = [
  {
    title: 'Watch Advertisement Video',
    description: 'Watch a 30-second advertisement video completely',
    type: 'watch_video',
    url: 'https://example.com/video1',
    duration: 30
  },
  {
    title: 'Visit Sponsor Website',
    description: 'Visit our sponsor website and browse for 1 minute',
    type: 'click_ad',
    url: 'https://example.com/sponsor',
    duration: 60
  },
  {
    title: 'Complete Short Survey',
    description: 'Complete a quick 5-question survey',
    type: 'survey',
    url: 'https://example.com/survey',
    duration: 120
  },
  {
    title: 'Follow Social Media Page',
    description: 'Follow our Facebook page and like 3 posts',
    type: 'social_media',
    url: 'https://facebook.com/example',
    duration: 45
  },
  {
    title: 'Watch Product Review',
    description: 'Watch a product review video completely',
    type: 'watch_video',
    url: 'https://example.com/review',
    duration: 60
  },
  {
    title: 'Sign up for Newsletter',
    description: 'Sign up for partner newsletter',
    type: 'other',
    url: 'https://example.com/newsletter',
    duration: 30
  },
  {
    title: 'Rate Mobile App',
    description: 'Download and rate partner mobile app',
    type: 'other',
    url: 'https://example.com/app',
    duration: 90
  },
  {
    title: 'Share on WhatsApp',
    description: 'Share promotional content on WhatsApp status',
    type: 'social_media',
    duration: 20
  },
  {
    title: 'Watch Tutorial Video',
    description: 'Watch educational tutorial video',
    type: 'watch_video',
    url: 'https://example.com/tutorial',
    duration: 120
  },
  {
    title: 'Visit E-commerce Store',
    description: 'Visit partner e-commerce store and browse products',
    type: 'click_ad',
    url: 'https://example.com/store',
    duration: 90
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Clear existing data
    await Package.deleteMany({});
    await Task.deleteMany({});

    // Insert packages
    const createdPackages = await Package.insertMany(packages);
    console.log(`✓ Created ${createdPackages.length} packages`);

    // Insert tasks
    const createdTasks = await Task.insertMany(tasks);
    console.log(`✓ Created ${createdTasks.length} tasks`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
