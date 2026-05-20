import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  // 1. Get the last conversation to find the PSID and the Page Token
  const config = await prisma.socialConfig.findFirst();
  const lastMsg = await prisma.messageHistory.findFirst({
    where: { direction: 'INBOUND' },
    orderBy: { timestamp: 'desc' }
  });

  if (!config || !config.pageAccessToken) {
    console.error('No SocialConfig found!');
    return;
  }

  if (!lastMsg) {
    console.error('No inbound messages found in history!');
    return;
  }

  console.log(`Testing send to PSID: ${lastMsg.psid} using token: ${config.pageAccessToken.substring(0, 20)}...`);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${config.pageId}/messages?access_token=${config.pageAccessToken}`,
      {
        recipient: { id: lastMsg.psid },
        message: { text: "Test debug reply from server with pageId" }
      }
    );
    console.log('SUCCESS! Response:', response.data);
  } catch (error: any) {
    console.error('FAILED! Exact Facebook Error:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
