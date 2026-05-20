import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const customers = await prisma.customer.findMany({ where: { tenantId: 't2' } });
  console.log('Customers in DB:', customers.length);
  customers.forEach(c => console.log(' -', c.id, '|', c.fullName, '|', c.phone));
  await prisma.$disconnect();
}

check();
