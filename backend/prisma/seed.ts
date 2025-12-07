/**
 * Golden Bond - Database Seed
 * Populates initial data for development/testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create membership plans
  console.log('Creating membership plans...');
  
  await prisma.membershipPlan.createMany({
    data: [
      {
        name: 'Gold',
        slug: 'gold',
        price: 99900, // ₹999 in paise
        currency: 'INR',
        durationDays: 30,
        features: [
          'View unlimited profiles',
          'See who viewed your profile',
          'Send 30 interests/month',
          'Priority in search results',
          'Basic compatibility scores'
        ],
        sortOrder: 1
      },
      {
        name: 'Diamond',
        slug: 'diamond',
        price: 199900, // ₹1999 in paise
        currency: 'INR',
        durationDays: 30,
        features: [
          'Everything in Gold',
          'Send unlimited interests',
          'AI-powered match suggestions',
          'Direct messaging',
          'Advanced compatibility breakdown',
          'Profile boost (2x visibility)',
          'Read receipts on messages'
        ],
        sortOrder: 2
      },
      {
        name: 'Elite',
        slug: 'elite',
        price: 499900, // ₹4999 in paise
        currency: 'INR',
        durationDays: 30,
        features: [
          'Everything in Diamond',
          'Personal matchmaking consultant',
          'Video verification badge',
          'VIP customer support (24/7)',
          'Profile featured on homepage',
          'Background check option',
          'Exclusive elite events access',
          '100% refund guarantee'
        ],
        sortOrder: 3
      },
      {
        name: 'Diamond Yearly',
        slug: 'diamond-yearly',
        price: 1439900, // ₹14399 in paise (40% off)
        currency: 'INR',
        durationDays: 365,
        features: [
          'All Diamond features',
          'Save 40% compared to monthly',
          '12 months of premium access'
        ],
        sortOrder: 4
      },
      {
        name: 'Elite Yearly',
        slug: 'elite-yearly',
        price: 3599900, // ₹35999 in paise (40% off)
        currency: 'INR',
        durationDays: 365,
        features: [
          'All Elite features',
          'Save 40% compared to monthly',
          '12 months of premium access'
        ],
        sortOrder: 5
      }
    ],
    skipDuplicates: true
  });

  // Create demo admin user
  console.log('Creating admin user...');
  
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@goldenbond.com' },
    update: {},
    create: {
      email: 'admin@goldenbond.com',
      passwordHash: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create demo users with profiles
  console.log('Creating demo profiles...');

  const demoUsers = [
    {
      email: 'rahul@demo.com',
      password: 'demo1234',
      profile: {
        firstName: 'Rahul',
        lastName: 'Sharma',
        gender: 'MALE',
        dob: new Date('1994-05-15'),
        maritalStatus: 'NEVER_MARRIED',
        religion: 'Hindu',
        community: 'Brahmin',
        subCommunity: 'Gaur',
        gotra: 'Bharadwaj',
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        motherTongue: 'Hindi',
        languagesKnown: ['Hindi', 'English', 'Marathi'],
        education: "Master's (M.Tech)",
        college: 'IIT Bombay',
        profession: 'Software Engineer',
        company: 'Google India',
        income: '40-50 Lakhs',
        height: '5\'10"',
        diet: 'VEGETARIAN',
        smoking: 'NO',
        drinking: 'OCCASIONALLY',
        bio: 'Hi! I\'m Rahul, a software engineer based in Mumbai with a passion for music, travel, and good conversations.',
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        idVerified: true,
        trustScore: 75,
        profileStatus: 'APPROVED'
      }
    },
    {
      email: 'priya@demo.com',
      password: 'demo1234',
      profile: {
        firstName: 'Priya',
        lastName: 'Sharma',
        gender: 'FEMALE',
        dob: new Date('1996-08-22'),
        maritalStatus: 'NEVER_MARRIED',
        religion: 'Hindu',
        community: 'Brahmin',
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        motherTongue: 'Hindi',
        languagesKnown: ['Hindi', 'English', 'Sanskrit'],
        education: "Master's (MBA)",
        college: 'IIM Ahmedabad',
        profession: 'Software Engineer',
        company: 'Google',
        income: '35-40 Lakhs',
        height: '5\'5"',
        diet: 'VEGETARIAN',
        smoking: 'NO',
        drinking: 'NO',
        bio: 'Software engineer who loves classical music and hiking. Looking for someone who shares similar values.',
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        idVerified: true,
        trustScore: 85,
        profileStatus: 'APPROVED'
      }
    },
    {
      email: 'ananya@demo.com',
      password: 'demo1234',
      profile: {
        firstName: 'Ananya',
        lastName: 'Reddy',
        gender: 'FEMALE',
        dob: new Date('1998-03-10'),
        maritalStatus: 'NEVER_MARRIED',
        religion: 'Hindu',
        community: 'Reddy',
        country: 'India',
        state: 'Karnataka',
        city: 'Bangalore',
        motherTongue: 'Telugu',
        languagesKnown: ['Telugu', 'English', 'Hindi', 'Kannada'],
        education: 'MBBS, MD',
        college: 'AIIMS Delhi',
        profession: 'Doctor',
        company: 'Apollo Hospital',
        income: '25-30 Lakhs',
        height: '5\'4"',
        diet: 'NON_VEGETARIAN',
        smoking: 'NO',
        drinking: 'OCCASIONALLY',
        bio: 'Cardiologist who believes in work-life balance. Love cooking and traveling.',
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        trustScore: 70,
        profileStatus: 'APPROVED'
      }
    },
    {
      email: 'sarah@demo.com',
      password: 'demo1234',
      profile: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        gender: 'FEMALE',
        dob: new Date('1995-11-05'),
        maritalStatus: 'NEVER_MARRIED',
        religion: 'Christian',
        community: 'Catholic',
        country: 'United Kingdom',
        state: 'England',
        city: 'London',
        motherTongue: 'English',
        languagesKnown: ['English', 'French', 'Spanish'],
        education: "Master's (Finance)",
        college: 'London School of Economics',
        profession: 'Investment Banker',
        company: 'Goldman Sachs',
        income: '£100,000+',
        height: '5\'7"',
        diet: 'NON_VEGETARIAN',
        smoking: 'NO',
        drinking: 'OCCASIONALLY',
        bio: 'Finance professional who loves art, travel, and good wine. Looking for a meaningful connection.',
        verified: true,
        emailVerified: true,
        trustScore: 65,
        profileStatus: 'APPROVED'
      }
    },
    {
      email: 'ahmed@demo.com',
      password: 'demo1234',
      profile: {
        firstName: 'Ahmed',
        lastName: 'Khan',
        gender: 'MALE',
        dob: new Date('1992-07-18'),
        maritalStatus: 'DIVORCED',
        religion: 'Muslim',
        community: 'Sunni',
        country: 'United Arab Emirates',
        state: 'Dubai',
        city: 'Dubai',
        motherTongue: 'Urdu',
        languagesKnown: ['Urdu', 'English', 'Arabic', 'Hindi'],
        education: "Master's (Business)",
        profession: 'Business Owner',
        income: 'AED 500,000+',
        height: '5\'11"',
        diet: 'NON_VEGETARIAN',
        smoking: 'NO',
        drinking: 'NO',
        bio: 'Entrepreneur looking for a second chance at love. Family-oriented with traditional values.',
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        trustScore: 60,
        profileStatus: 'APPROVED'
      }
    },
    {
      email: 'meera@demo.com',
      password: 'demo1234',
      profile: {
        firstName: 'Meera',
        lastName: 'Patel',
        gender: 'FEMALE',
        dob: new Date('1997-01-25'),
        maritalStatus: 'NEVER_MARRIED',
        religion: 'Hindu',
        community: 'Patel',
        country: 'India',
        state: 'Gujarat',
        city: 'Ahmedabad',
        motherTongue: 'Gujarati',
        languagesKnown: ['Gujarati', 'Hindi', 'English'],
        education: "Bachelor's (CA)",
        profession: 'Chartered Accountant',
        company: 'Deloitte',
        income: '15-20 Lakhs',
        height: '5\'3"',
        diet: 'VEGETARIAN',
        smoking: 'NO',
        drinking: 'NO',
        bio: 'CA by profession, foodie by passion. Looking for someone who appreciates good food and family values.',
        verified: true,
        emailVerified: true,
        trustScore: 55,
        profileStatus: 'APPROVED'
      }
    }
  ];

  for (const userData of demoUsers) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash
      }
    });

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id }
    });

    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          profileCode: `GB-2024-${Math.floor(10000 + Math.random() * 90000)}`,
          ...userData.profile
        }
      });
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('\nDemo accounts:');
  console.log('  Admin: admin@goldenbond.com / admin123');
  console.log('  User:  rahul@demo.com / demo1234');
  console.log('  User:  priya@demo.com / demo1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

