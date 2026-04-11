const mongoose = require('mongoose');
const School = require('../models/School');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management';

const universityData = {
  "School of Technology (SOT)": {
    dean: "sot@dean.com",
    levels: {
      "Under Graduate": [
        "B.Tech. Computer Science and Engineering",
        "B.Tech. Electronics and Communication Engineering",
        "B.Tech. Mechanical Engineering",
        "B.Tech. Civil Engineering",
        "B.Tech. Electrical and Electronics Engineering"
      ],
      "Post Graduate": [
        "M.Tech. Computer Science",
        "M.Tech. Data Science",
        "M.Tech. VLSI Design"
      ]
    }
  },
  "School of Management (SOM)": {
    dean: "som@dean.com",
    levels: {
      "Under Graduate": [
        "B.B.A. General",
        "B.B.A. Business Analytics",
        "B.B.A. Digital Marketing",
        "B.Com. Honours"
      ],
      "Post Graduate": [
        "M.B.A. Finance",
        "M.B.A. Marketing",
        "M.B.A. Human Resource Management",
        "M.B.A. Business Analytics"
      ]
    }
  },
  "School of Health Sciences (SOHS)": {
    dean: "sohs@dean.com",
    levels: {
      "Under Graduate": [
        "B.Sc. Nursing",
        "B.P.T. (Physiotherapy)",
        "B.Sc. Medical Laboratory Technology",
        "B.Sc. Radiology and Imaging Technology",
        "B.Sc. Optometry"
      ],
      "Post Graduate": [
        "M.Sc. Nursing",
        "M.P.T. Sports",
        "M.Sc. Clinical Psychology"
      ]
    }
  },
  "School of Social Science (SOSS)": {
    dean: "soss@dean.com",
    levels: {
      "Under Graduate": [
        "Bachelor of Social Work (BSW)",
        "B.A. Psychology",
        "B.A. Economics"
      ],
      "Post Graduate": [
        "Master of Social Work (MSW)",
        "M.A. Applied Psychology"
      ]
    }
  },
  "Apollo Institute of Pharmaceutical Sciences (AIPS)": {
    dean: "aips@dean.com",
    levels: {
      "Under Graduate": [
        "B.Pharmacy"
      ],
      "Post Graduate": [
        "Pharm.D."
      ]
    }
  }
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await School.deleteMany({});
    console.log('Cleared existing schools');

    for (const [name, data] of Object.entries(universityData)) {
      const levels = Object.entries(data.levels).map(([levelName, courses]) => ({
        name: levelName,
        courses: courses
      }));

      const school = new School({
        name,
        deanName: data.dean,
        levels
      });

      await school.save();
      console.log(`Seeded: ${name}`);
    }

    console.log('✅ Schools and levels seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
