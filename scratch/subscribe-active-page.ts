import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.socialConfig.findMany();
  if (configs.length === 0) {
    console.error('No SocialConfig found in the database!');
    return;
  }

  const config = configs[0];
  const { pageId, pageAccessToken } = config;

  if (!pageId || !pageAccessToken) {
    console.error('Page ID or Page Access Token is empty in SocialConfig!');
    return;
  }

  console.log(`--- Subscribing Active Page: "${pageId}" ---`);
  try {
    const url = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`;
    const response = await axios.post(url, null, {
      params: {
        subscribed_fields: 'messages,messaging_postbacks,message_reads,messaging_optins',
        access_token: pageAccessToken
      }
    });
    console.log(`SUCCESS! Subscribed Page ${pageId} successfully. Response:`, response.data);
  } catch (error: any) {
    console.error(`FAILED! Could not subscribe Page ${pageId}:`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
