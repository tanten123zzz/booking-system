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
  const token = config.pageAccessToken;
  
  // We will test subscribing BOTH page IDs to see what Graph API says!
  const pageIds = ['1466572923613975', '100090741296266'];

  for (const pageId of pageIds) {
    console.log(`\n--- Attempting to subscribe Page ID: ${pageId} ---`);
    try {
      const url = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`;
      const response = await axios.post(url, null, {
        params: {
          subscribed_fields: 'messages,messaging_postbacks',
          access_token: token
        }
      });
      console.log(`Success! Response for ${pageId}:`, response.data);
    } catch (error: any) {
      console.error(`Failed to subscribe ${pageId}:`);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error message:', error.message);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
