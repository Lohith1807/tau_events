const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management';

const seedUsers = [
  {
    name: 'System Admin',
    email: 'admin@test.com',
    password: '123',
    role: 'admin',
    isVerified: true,
    school: 'University Admin'
  },
  {
    name: 'Dr. Registrar',
    email: 'registrar@test.com',
    password: '123',
    role: 'registrar',
    isVerified: true,
    school: 'University Admin'
  },
  // School of Technology (SOT)
  {
    name: 'Dean SOT',
    email: 'sot@dean.com',
    password: '123',
    role: 'dean',
    isVerified: true,
    school: 'School of Technology (SOT)'
  },
  // School of Management (SOM)
  {
    name: 'Dean SOM',
    email: 'som@dean.com',
    password: '123',
    role: 'dean',
    isVerified: true,
    school: 'School of Management (SOM)'
  },
  // School of Health Sciences (SOHS)
  {
    name: 'Dean SOHS',
    email: 'sohs@dean.com',
    password: '123',
    role: 'dean',
    isVerified: true,
    school: 'School of Health Sciences (SOHS)'
  },
  // School of Social Science (SOSS)
  {
    name: 'Dean SOSS',
    email: 'soss@dean.com',
    password: '123',
    role: 'dean',
    isVerified: true,
    school: 'School of Social Science (SOSS)'
  },
  // Apollo Institute of Pharmaceutical Sciences (AIPS)
  {
    name: 'Dean AIPS',
    email: 'aips@dean.com',
    password: '123',
    role: 'dean',
    isVerified: true,
    school: 'Apollo Institute of Pharmaceutical Sciences (AIPS)'
  },
  {
    name: 'SOT Faculty',
    email: 'teacher@test.com',
    password: '123',
    role: 'faculty',
    isVerified: true,
    school: 'School of Technology (SOT)'
  },
  {
    name: 'Student User',
    email: 'student@test.com',
    password: '123',
    role: 'student',
    isVerified: true,
    rollNo: '122411510210',
    school: 'School of Technology (SOT)',
    programLevel: 'Under Graduate',
    department: 'B.Tech. Computer Science and Engineering',
    batch: '2024'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'test' });
    console.log('Connected to MongoDB: test');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create seed users
    for (const userData of seedUsers) {
      const user = new User(userData);
      try {
        await user.save();
        console.log(`Created: ${user.email} (${user.role})`);
      } catch (err) {
        console.error(`Validation error for ${user.email}:`, err.errors || err.message);
        throw err;
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('─────────────────────────────────');
    seedUsers.forEach(u => {
      console.log(`${u.role.toUpperCase().padEnd(12)} → ${u.email}`);
    });
    console.log('Password for all: 123');
    console.log('─────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('Seed error stack:', error.stack || error);
    process.exit(1);
  }
}

seed();
