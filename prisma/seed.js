// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 1. Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch-id' }, // fixed ID for now
    update: {},
    create: {
      id: 'default-branch-id',
      name: 'Your Gym Name',
      address: 'Your Gym Address, City, State, PIN',
      phone: '9999999999',
      gstin: '29ABCDE1234F1Z5', // put real GSTIN here
      logoUrl: null,
    },
  });

  // 2. Settings with default PIN (e.g. 1234)
  const rawPin = '1234'; // CHANGE THIS BEFORE GOING LIVE
  const pinHash = await bcrypt.hash(rawPin, 10);

  await prisma.setting.upsert({
    where: { id: 'default-setting-id' },
    update: {
      pinHash,
      branchId: branch.id,
    },
    create: {
      id: 'default-setting-id',
      branchId: branch.id,
      pinHash,
    },
  });

  // 3. Plans
  const plans = [
    {
      code: 'BASIC_30',
      name: 'Basic Plan',
      durationDays: 30,
      baseAmount: 1499.0,
      isTaxable: true,
      gstRate: 18.0,
    },
    {
      code: 'STANDARD_90',
      name: 'Standard Plan',
      durationDays: 90,
      baseAmount: 3999.0,
      isTaxable: true,
      gstRate: 18.0,
    },
    {
      code: 'PREMIUM_180',
      name: 'Premium Plan',
      durationDays: 180,
      baseAmount: 7499.0,
      isTaxable: true,
      gstRate: 18.0,
    },
    {
      code: 'ULTIMATE_360',
      name: 'Ultimate Plan',
      durationDays: 360,
      baseAmount: 11999.0,
      isTaxable: true,
      gstRate: 18.0,
    },
    {
      code: 'DAILY_PASS_1',
      name: 'Daily Pass',
      durationDays: 1,
      baseAmount: 249.0,
      isTaxable: true,
      gstRate: 18.0,
    },
    {
      code: 'PT_20_SESSIONS',
      name: 'Personal Trainer - 20 Sessions',
      durationDays: null,
      baseAmount: 7999.0,
      isTaxable: false,
      gstRate: 0.0,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
