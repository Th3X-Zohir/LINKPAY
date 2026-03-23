import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@linkpaybd.com' },
    update: {},
    create: {
      email: 'admin@linkpaybd.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      phone: '01712345678',
      bkashNumber: '01712345678',
      bankAccount: '1234567890',
      bankName: 'Dutch-Bangla Bank',
      bankRouting: '090173514',
      plan: 'PREMIUM',
    },
  })

  console.log(`✅ Admin user created:`)
  console.log(`   Email: admin@linkpaybd.com`)
  console.log(`   Password: admin123`)
  console.log(`   Plan: PREMIUM`)

  // Create a demo freelancer user
  const demoPassword = await bcrypt.hash('demo123', 12)
  
  const demo = await prisma.user.upsert({
    where: { email: 'demo@linkpaybd.com' },
    update: {},
    create: {
      email: 'demo@linkpaybd.com',
      name: 'Rahul Ahmed',
      passwordHash: demoPassword,
      phone: '01812345678',
      bkashNumber: '01812345678',
      plan: 'FREE',
    },
  })

  console.log(`\n✅ Demo user created:`)
  console.log(`   Email: demo@linkpaybd.com`)
  console.log(`   Password: demo123`)
  console.log(`   Plan: FREE`)

  // Create sample payment links for demo user
  const paymentLink1 = await prisma.paymentLink.upsert({
    where: { shareUrl: 'demo-link-001' },
    update: {},
    create: {
      userId: demo.id,
      amount: 500000, // 5000 BDT in poisha
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

  // Create a successful transaction for the payment link
  await prisma.transaction.upsert({
    where: { id: 'demo-txn-001' },
    update: {},
    create: {
      id: 'demo-txn-001',
      paymentLinkId: paymentLink1.id,
      userId: demo.id,
      amount: 500000,
      platformFee: 3750, // 0.75%
      gatewayFee: 12750, // 2.55%
      netAmount: 483500,
      status: 'SUCCESS',
      aamarPayTxnId: 'AMR_demo_tx_001',
      aamarPayFees: JSON.stringify({ platform: 3750, gateway: 12750 }),
    },
  })

  // Create pending payment link
  await prisma.paymentLink.upsert({
    where: { shareUrl: 'demo-link-002' },
    update: {},
    create: {
      userId: demo.id,
      amount: 150000, // 1500 BDT
      description: 'Logo design for startup',
      customerName: 'Sarah Johnson',
      status: 'PENDING',
      shareUrl: 'demo-link-002',
    },
  })

  console.log(`\n✅ Sample payment links created for demo user`)

  console.log(`\n🎉 Database seeding complete!`)
  console.log(`\n📝 Login credentials:`)
  console.log(`   Admin: admin@linkpaybd.com / admin123`)
  console.log(`   Demo: demo@linkpaybd.com / demo123`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
