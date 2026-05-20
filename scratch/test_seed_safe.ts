import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  // Tạo test customer
  const c = await prisma.customer.create({
    data: { fullName: 'TEST USER XYZ', phone: '+19999999999', tenantId: 't2' }
  });
  console.log('✅ Created test customer:', c.id, '-', c.fullName);

  // Chạy seed và xem có bị xóa không
  const { execSync } = await import('child_process');
  console.log('\n▶️ Running npx prisma db seed...\n');
  execSync('npx prisma db seed', { stdio: 'inherit', cwd: process.cwd() });

  // Kiểm tra sau seed
  const found = await prisma.customer.findUnique({ where: { id: c.id } });
  if (found) {
    console.log('\n✅ TEST PASSED: Customer vẫn còn sau khi seed:', found.fullName);
  } else {
    console.log('\n❌ TEST FAILED: Customer bị xóa sau khi seed!');
  }

  // Dọn dẹp test customer
  await prisma.customer.delete({ where: { id: c.id } });
  console.log('🧹 Cleaned up test customer');

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
