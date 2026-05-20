import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.socialConfig.findMany();
  if (configs.length === 0) {
    console.error('No SocialConfig found!');
    return;
  }

  const config = configs[0];
  const token = config.pageAccessToken;
  const pageId = '1466572923613975'; // Trai Xinh Gái Đẹp

  try {
    const url = `https://graph.facebook.com/v21.0/1130736580120441/subscriptions`;
    const response = await axios.get(url, {
      params: {
        access_token: 'EAAQEZAiAxT3kBRqyLRMG8E3NyorUONnmi8d3oU87QCN2ElraYSpYZAJMk7jzgDYHJrcZCrTMuTAK8okRW3PhjWzaW2CkzwBdUmWiRdXt55o2qcNyeC4ZCs9152PlXAoXaBMYIkZBFbqgO8sfzjG0ZBrZA1CwMB1a7kLTLMd3hMC4o4UO6cltZAZBkZAZCQtUErX0ECI5yoSTORRuhTrKeVdaJfZARAQI1KmODktig9ZBCESaCbpAbtjXrJZCniEW2ZB5ZB3QAzODTXamqkUA8wnIda59ZAZBZCx'
      }
    });
    console.log('--- SUBSCRIBED APPS AND FIELDS ---');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Failed to get subscriptions:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
