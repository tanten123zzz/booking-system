import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const bob = await p.customer.findFirst({ where: { fullName: 'Bob Brown' } });
console.log('Before update - visits:', bob.visits);

await p.customer.update({
  where: { id: bob.id },
  data: { visits: { increment: 1 } }
});

const bobAfter = await p.customer.findFirst({ where: { fullName: 'Bob Brown' } });
console.log('After update - visits:', bobAfter.visits);

await p.$disconnect();
