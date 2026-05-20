import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, slug: true, name: true }
  });
  console.log('Tenants simplified:', JSON.stringify(tenants, null, 2));
  await prisma.$disconnect();
}

check();
