import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function test() {
  const tenantId = 't2';
  const psid = '26315837881428090';

  const socialConfig = await prisma.socialConfig.findUnique({
    where: { tenantId }
  });

  if (socialConfig && socialConfig.pageAccessToken) {
    try {
      console.log(`[FB API] Fetching REAL avatar for PSID: ${psid}`);
      const pictureRes = await axios.get(
        `https://graph.facebook.com/v21.0/${psid}/picture?type=large&redirect=0&access_token=${socialConfig.pageAccessToken}`
      );
      
      if (pictureRes.data && pictureRes.data.data && pictureRes.data.data.url) {
        const avatarUrl = pictureRes.data.data.url;
        console.log('REAL Avatar URL:', avatarUrl);
        await prisma.customer.updateMany({
          where: { tenantId, psid },
          data: {
            avatarUrl: avatarUrl
          } as any
        });
        console.log(`Successfully updated REAL avatar for Tony Tran in database!`);
      }
    } catch (err: any) {
      console.error(`Failed to update real avatar:`, err.message);
    }
  }

  await prisma.$disconnect();
}

test();
