const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedIfEmpty() {
  const userCount = await prisma.user.count()

  if (userCount > 0) {
    console.log(`[seed] Skip seeding: users already exist (${userCount})`)
    return
  }

  console.log('[seed] First run detected. Seeding initial demo data...')

  const adminPassword = await bcrypt.hash('admin123', 12)
  const demoPassword = await bcrypt.hash('demo123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@linkpaybd.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      phone: '01712345678',
      bkashNumber: '01712345678',
      bankAccount: '1234567890',
      bankName: 'Dutch-Bangla Bank',
      bankRouting: '090173514',
      plan: 'PREMIUM',
      isAdmin: true,
    },
  })

  const demo = await prisma.user.create({
    data: {
      email: 'demo@linkpaybd.com',
      name: 'Rahul Ahmed',
      passwordHash: demoPassword,
      phone: '01812345678',
      bkashNumber: '01812345678',
      plan: 'FREE',
    },
  })

  const paymentLink1 = await prisma.paymentLink.create({
    data: {
      userId: demo.id,
      amount: 500000,
      description: 'Website redesign project for US client',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      customerMobile: '01712345678',
      status: 'PAID',
      shareUrl: 'demo-link-001',
      aamarPayId: 'demo_tx_001',
      paidAt: new Date(),
    },
  })

  await prisma.transaction.create({
    data: {
      paymentLinkId: paymentLink1.id,
      userId: demo.id,
      amount: 500000,
      platformFee: 3750,
      gatewayFee: 12750,
      netAmount: 483500,
      status: 'SUCCESS',
      aamarPayTxnId: 'AMR_demo_tx_001',
      aamarPayFees: JSON.stringify({ platform: 3750, gateway: 12750 }),
    },
  })

  await prisma.paymentLink.create({
    data: {
      userId: demo.id,
      amount: 150000,
      description: 'Logo design for startup',
      customerName: 'Sarah Johnson',
      status: 'PENDING',
      shareUrl: 'demo-link-002',
    },
  })

  console.log('[seed] Initial seed complete')
  console.log('[seed] Admin login: admin@linkpaybd.com / admin123')
  console.log('[seed] Demo login: demo@linkpaybd.com / demo123')
  console.log(`[seed] Seeded users: admin=${admin.email}, demo=${demo.email}`)
}

seedIfEmpty()
  .catch((error) => {
    console.error('[seed] Failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
