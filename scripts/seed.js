const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@viziopath.info',
    password: 'admin123',
    role: 'admin',
    isVerified: true
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user',
    isVerified: true
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: 'password123',
    role: 'user',
    isVerified: true
  }
];

const sampleProfiles = [
  {
    bio: 'Experienced software engineer with passion for web development',
    location: 'San Francisco, CA',
    company: 'Tech Corp',
    jobTitle: 'Senior Software Engineer',
    skills: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'AWS'],
    education: [
      {
        institution: 'Stanford University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: new Date('2015-09-01'),
        endDate: new Date('2019-06-01'),
        description: 'Focused on software engineering and web technologies'
      }
    ],
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        startDate: new Date('2019-07-01'),
        current: true,
        description: 'Leading development of scalable web applications'
      }
    ],
    social: {
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe'
    }
  },
  {
    bio: 'UX/UI designer creating beautiful and functional user experiences',
    location: 'New York, NY',
    company: 'Design Studio',
    jobTitle: 'Lead UX Designer',
    skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
    education: [
      {
        institution: 'Parsons School of Design',
        degree: 'Bachelor of Fine Arts',
        field: 'Design and Technology',
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-06-01'),
        description: 'Specialized in digital design and user experience'
      }
    ],
    experience: [
      {
        company: 'Design Studio',
        position: 'Lead UX Designer',
        startDate: new Date('2020-07-01'),
        current: true,
        description: 'Leading design team and creating user-centered solutions'
      }
    ],
    social: {
      linkedin: 'https://linkedin.com/in/janesmith',
      behance: 'https://behance.net/janesmith'
    }
  },
  {
    bio: 'Data scientist passionate about machine learning and analytics',
    location: 'Seattle, WA',
    company: 'Data Analytics Inc',
    jobTitle: 'Senior Data Scientist',
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'TensorFlow'],
    education: [
      {
        institution: 'University of Washington',
        degree: 'Master of Science',
        field: 'Data Science',
        startDate: new Date('2017-09-01'),
        endDate: new Date('2019-06-01'),
        description: 'Focused on machine learning algorithms and data analysis'
      }
    ],
    experience: [
      {
        company: 'Data Analytics Inc',
        position: 'Senior Data Scientist',
        startDate: new Date('2019-07-01'),
        current: true,
        description: 'Developing ML models and providing data-driven insights'
      }
    ],
    social: {
      linkedin: 'https://linkedin.com/in/bobjohnson',
      github: 'https://github.com/bobjohnson'
    }
  }
];

// Connect to database
const connectDB = async () => {
  try {
    const uri = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MongoDB URI not configured');
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
};

// Seed profiles
const seedProfiles = async (users) => {
  try {
    // Clear existing profiles
    await Profile.deleteMany({});
    console.log('🗑️ Cleared existing profiles');

    // Create profiles
    for (let i = 0; i < users.length; i++) {
      if (i < sampleProfiles.length) {
        const profile = await Profile.create({
          user: users[i]._id,
          ...sampleProfiles[i]
        });
        console.log(`✅ Created profile for: ${users[i].name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding profiles:', error.message);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    const users = await seedUsers();
    await seedProfiles(users);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${users.length} users and profiles`);
    
    // Display sample login credentials
    console.log('\n🔑 Sample login credentials:');
    sampleUsers.forEach(user => {
      console.log(`   ${user.email} / ${user.password}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, connectDB };
