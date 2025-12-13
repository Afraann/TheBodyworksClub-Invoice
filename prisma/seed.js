// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 1. Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'default-branch-id' },
    update: {},
    create: {
      id: 'default-branch-id',
      name: 'The Bodyworks Club',
      address: 'Pandeshwar, Mangalore',
      phone: '9876543210',
      gstin: '29ABCDE1234F1Z5',
      logoUrl: null,
    },
  });

  // 2. Settings (ADMIN & STAFF PINS)
  const adminPinRaw = '1234';  // <--- ADMIN PIN
  const staffPinRaw = '0000';  // <--- STAFF PIN (Set this to whatever you want)
  
  const pinHash = await bcrypt.hash(adminPinRaw, 10);
  const staffPinHash = await bcrypt.hash(staffPinRaw, 10);

  await prisma.setting.upsert({
    where: { id: 'default-setting-id' },
    update: {
      pinHash,       // Admin
      staffPinHash,  // Staff
      branchId: branch.id,
    },
    create: {
      id: 'default-setting-id',
      branchId: branch.id,
      pinHash,
      staffPinHash,
    },
  });

  // ... (Plans code remains the same) ...
  
  console.log('Seed completed. Admin PIN: 1234, Staff PIN: 0000');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });