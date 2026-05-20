import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const services = await prisma.service.findMany();
  console.log(JSON.stringify(services, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
