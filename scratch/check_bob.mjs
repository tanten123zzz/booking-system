import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const bob = await p.customer.findFirst({ where: { fullName: 'Bob Brown' } });
console.log('Bob Brown:', bob);

const bookings = await p.booking.findMany({ 
  where: { customerId: bob.id },
  include: { customer: true }
});
console.log('Bookings for Bob:', bookings.map(b => ({ id: b.id, status: b.status })));

await p.$disconnect();
