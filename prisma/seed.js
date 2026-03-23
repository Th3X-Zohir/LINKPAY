// seed.js - Database seed script
// Run with: node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.paymentLink.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12);
  const demoPassword = await bcrypt.hash('demo123', 12);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@linkpaybd.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      plan: 'PREMIUM',
      bkashNumber: '01712345678',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo user
  const demo = await prisma.user.create({
    data: {
      email: 'demo@linkpaybd.com',
      name: 'Demo User',
      passwordHash: demoPassword,
      plan: 'FREE',
    },
  });
  console.log('✅ Created demo user:', demo.email);

  // Create sample payment links for admin
  const paymentLinks = await Promise.all([
    prisma.paymentLink.create({
      data: {
        userId: admin.id,
        amount: 50000,
        description: 'Website Development Project',
        status: 'PAID',
        shareUrl: 'linkpay-bd.com/pay/web-dev-001',
        aamarPayId: 'amp_1234567890',
      },
    }),
    prisma.paymentLink.create({
      data: {
        userId: admin.id,
        amount: 25000,
        description: 'Logo Design Services',
        status: 'PENDING',
        shareUrl: 'linkpay-bd.com/pay/logo-design-002',
      },
    }),
    prisma.paymentLink.create({
      data: {
        userId: admin.id,
        amount: 100000,
        description: 'Mobile App Development',
        status: 'PAID',
        shareUrl: 'linkpay-bd.com/pay/app-dev-003',
        aamarPayId: 'amp_0987654321',
      },
    }),
  ]);
  console.log('✅ Created', paymentLinks.length, 'payment links');

  // Create sample transactions
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        paymentLinkId: paymentLinks[0].id,
        userId: admin.id,
        amount: 50000,
        platformFee: 375,
        aamarPayFee: 500,
        netAmount: 49125,
        status: 'SUCCESS',
        aamarPayTxnId: 'txn_123456',
        payoutStatus: 'COMPLETED',
      },
    }),
    prisma.transaction.create({
      data: {
        paymentLinkId: paymentLinks[2].id,
        userId: admin.id,
        amount: 100000,
        platformFee: 750,
        aamarPayFee: 1000,
        netAmount: 98250,
        status: 'SUCCESS',
        aamarPayTxnId: 'txn_098765',
        payoutStatus: 'PENDING',
      },
    }),
  ]);
  console.log('✅ Created', transactions.length, 'transactions');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Admin login: admin@linkpaybd.com / admin123');
  console.log('Demo login: demo@linkpaybd.com / demo123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
