import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const customers = await prisma.customer.findMany({
    where: { psid: { not: null } }
  });
  console.log('Linked customers:', JSON.stringify(customers, null, 2));

  const messages = await prisma.messageHistory.findMany({
    orderBy: { timestamp: 'desc' },
    take: 10
  });
  console.log('Recent messages:', JSON.stringify(messages, null, 2));

  await prisma.$disconnect();
}

check();
