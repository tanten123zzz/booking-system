import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.socialConfig.findMany();
  console.log('--- SOCIAL CONFIGS ---');
  console.log(JSON.stringify(configs, null, 2));

  const messages = await prisma.messageHistory.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5
  });
  console.log('--- RECENT MESSAGES ---');
  console.log(JSON.stringify(messages, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
