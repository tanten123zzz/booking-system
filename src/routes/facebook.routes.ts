import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import axios from 'axios';

const router = Router();

// Helper function to fetch either Facebook or Instagram user profile details dynamically
async function fetchSocialProfile(psid: string, pageAccessToken: string) {
  // If we are in mock/test mode, skip remote API calls to prevent console errors
  if (
    psid.startsWith('mock') || 
    psid.includes('fb') || 
    psid.includes('ig') || 
    pageAccessToken.startsWith('mock')
  ) {
    const platform = psid.includes('ig') ? 'instagram' : 'facebook';
    return {
      fullName: `Guest User (${psid.slice(-4)})`,
      avatarUrl: null,
      platform
    };
  }

  // 1. Try Facebook Graph API first
  try {
    const res = await axios.get(
      `https://graph.facebook.com/v21.0/${psid}?fields=first_name,last_name&access_token=${pageAccessToken}`
    );
    let avatarUrl: string | null = null;
    try {
      const pictureRes = await axios.get(
        `https://graph.facebook.com/v21.0/${psid}/picture?type=large&redirect=0&access_token=${pageAccessToken}`
      );
      if (pictureRes.data && pictureRes.data.data && pictureRes.data.data.url) {
        avatarUrl = pictureRes.data.data.url;
      }
    } catch (picErr) {
      // Quietly ignore and fallback if picture endpoint doesn't work for this ID
    }
    
    if (res.data && (res.data.first_name || res.data.last_name)) {
      return {
        fullName: `${res.data.first_name || ''} ${res.data.last_name || ''}`.trim(),
        avatarUrl,
        platform: 'facebook'
      };
    }
  } catch (err) {
    // If Facebook API fails (e.g. for Instagram Scoped ID), proceed to Instagram API
  }

  // 2. Try Instagram User Profile API
  try {
    const res = await axios.get(
      `https://graph.facebook.com/v21.0/${psid}?fields=name,username,profile_pic&access_token=${pageAccessToken}`
    );
    if (res.data) {
      return {
        fullName: res.data.name || res.data.username || `IG User (${psid.slice(-4)})`,
        avatarUrl: res.data.profile_pic || null,
        platform: 'instagram'
      };
    }
  } catch (err) {
    console.error(`[Social API] Failed to fetch profile details on both Facebook and Instagram for PSID ${psid}:`, err);
  }

  // Fallback default
  return {
    fullName: `Guest User (${psid.slice(-4)})`,
    avatarUrl: null,
    platform: 'unknown'
  };
}

// --- WEBHOOK ENDPOINTS ---

/**
 * Facebook Webhook Verification (GET)
 */
router.get('/webhook', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // For simplicity, we can use a global verify token or check against any SocialConfig
  // In a real multi-tenant scenario, Facebook sends one request per app.
  // We'll use a default verify token from env or a hardcoded one.
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'salon_booking_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

router.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page' || body.object === 'instagram') {
    for (const entry of body.entry) {
      const pageId = entry.id;
      const messaging = entry.messaging ? entry.messaging[0] : null;

      if (messaging && messaging.message) {
        const senderId = messaging.sender.id; // PSID or IGSID of customer
        const recipientId = messaging.recipient.id; // Page ID or Instagram Account ID
        let messageText = messaging.message.text;
        const mid = messaging.message.mid;
        const attachments = messaging.message.attachments;

        // If there is no text, but there are attachments (e.g. image)
        if (!messageText && attachments && attachments.length > 0) {
          const firstAttachment = attachments[0];
          if (firstAttachment.type === 'image' && firstAttachment.payload?.url) {
            messageText = firstAttachment.payload.url;
          }
        }

        if (!messageText) continue;

        const platform = body.object === 'instagram' ? 'instagram' : 'facebook';
        console.log(`[${platform.toUpperCase()} Webhook] ${senderId} → ${recipientId}: ${messageText}`);

        // 1. Find Tenant: for Instagram, try igAccountId first
        let socialConfig: any = null;
        if (platform === 'instagram') {
          socialConfig = await (prisma.socialConfig as any).findFirst({
            where: { igAccountId: recipientId },
            include: { tenant: true }
          });
        }
        if (!socialConfig) {
          socialConfig = await (prisma.socialConfig as any).findFirst({
            where: { pageId: recipientId },
            include: { tenant: true }
          });
        }

        if (!socialConfig) {
          console.warn(`[${platform.toUpperCase()} Webhook] No SocialConfig for ID: ${recipientId}`);
          continue;
        }

        const tenant = socialConfig.tenant;

        // 2. Automatically check and sync Facebook/Instagram profile to Customer DB
        let existingCustomer = await prisma.customer.findFirst({
          where: { tenantId: tenant.id, psid: senderId }
        });

        if (socialConfig.pageAccessToken) {
          try {
            console.log(`[Social Webhook] Syncing profile details for PSID: ${senderId}`);
            const profile = await fetchSocialProfile(senderId, socialConfig.pageAccessToken);
            
            if (existingCustomer) {
              existingCustomer = await prisma.customer.update({
                where: { id: existingCustomer.id },
                data: {
                  fullName: profile.fullName,
                  avatarUrl: profile.avatarUrl
                } as any
              });
              console.log(`[Social Webhook] Updated existing customer profile: ${profile.fullName} (${profile.platform})`);
            }
          } catch (err) {
            console.error(`[Social Webhook] Failed to fetch/update profile:`, err);
          }
        }

        // 3. Save message with platform tag
        await prisma.messageHistory.create({
          data: {
            tenantId: tenant.id,
            psid: senderId,
            senderId: senderId,
            recipientId: recipientId,
            content: messageText,
            mid: mid,
            direction: 'INBOUND',
            platform
          }
        });

        // 4. Auto-Reply (only if active)
        if (socialConfig.isActive) {
          await handleAutoReply(tenant, senderId, messageText, socialConfig.pageAccessToken, platform);
        } else {
          console.log(`[Social Webhook] Chatbot AI auto-reply is toggled OFF for ${tenant.name}. Skipping.`);
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// --- DASHBOARD API ENDPOINTS ---

/**
 * Get all conversations for a tenant
 */
router.get('/conversations/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { platform } = req.query; // optional: 'facebook' | 'instagram'
  
  // Filter by platform if specified
  const where: any = { tenantId };
  if (platform === 'facebook' || platform === 'instagram') {
    where.platform = platform;
  }

  // Group messages by PSID and get the last message for each per platform
  const messages = await prisma.messageHistory.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });

  const conversations = await Promise.all(
    Object.values(
      messages.reduce((acc: any, msg) => {
        if (!acc[msg.psid]) {
          acc[msg.psid] = msg;
        }
        return acc;
      }, {})
    ).map(async (conv: any) => {
      let customer = await prisma.customer.findFirst({
        where: { tenantId, psid: conv.psid }
      });

      let facebookProfile = null;
      if (!customer) {
        const socialConfig = await prisma.socialConfig.findUnique({ where: { tenantId } });
        if (socialConfig && socialConfig.pageAccessToken) {
          const profile = await fetchSocialProfile(conv.psid, socialConfig.pageAccessToken);
          if (profile) {
            facebookProfile = { fullName: profile.fullName, avatarUrl: profile.avatarUrl, platform: profile.platform };
          }
        }
      }

      return {
        ...conv,
        customer: customer ? { fullName: customer.fullName, phone: customer.phone, tier: customer.tier, avatarUrl: (customer as any).avatarUrl } : null,
        facebookProfile
      };
    })
  );

  res.json(conversations);
});

/**
 * Get customer details and booking history by PSID
 */
router.get('/customer/:tenantId/:psid', async (req, res) => {
  const { tenantId, psid } = req.params;
  
  const customer = await prisma.customer.findFirst({
    where: { tenantId, psid },
    include: {
      bookings: {
        include: {
          service: true,
          staff: true
        },
        orderBy: {
          dateTime: 'desc'
        },
        take: 10
      }
    }
  });

  if (!customer) {
    // If customer record doesn't exist, fetch lookaside profile dynamically
    const socialConfig = await prisma.socialConfig.findUnique({
      where: { tenantId }
    });
    let facebookProfile = null;
    if (socialConfig && socialConfig.pageAccessToken) {
      const profile = await fetchSocialProfile(psid, socialConfig.pageAccessToken);
      if (profile) {
        facebookProfile = {
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          platform: profile.platform
        };
      }
    }
    return res.json({ isUnlinked: true, facebookProfile });
  }

  res.json(customer);
});

/**
 * Link a PSID to an existing customer
 */
router.post('/link-customer', async (req, res) => {
  const { tenantId, psid, customerId } = req.body;

  try {
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId, tenantId },
      data: { psid }
    });
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to link customer' });
  }
});

/**
 * Create a new Customer profile from a Facebook user and link them
 */
router.post('/customer/create', async (req, res) => {
  const { tenantId, psid, fullName, avatarUrl } = req.body;

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        tenantId,
        fullName,
        phone: `FB_${psid.slice(-4)}`,
        psid,
        avatarUrl: avatarUrl || null,
        tier: 'Thường'
      } as any
    });
    res.json(newCustomer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create customer profile' });
  }
});

/**
 * Get message history for a specific customer (PSID)
 */
router.get('/history/:tenantId/:psid', async (req, res) => {
  const { tenantId, psid } = req.params;
  const history = await prisma.messageHistory.findMany({
    where: { tenantId, psid },
    orderBy: { timestamp: 'asc' }
  });
  res.json(history);
});

/**
 * Send a message from Dashboard to Messenger
 */
router.post('/send', async (req, res) => {
  const { tenantId, psid, content, platform = 'facebook' } = req.body;

  const socialConfig = await prisma.socialConfig.findUnique({
    where: { tenantId }
  });

  if (!socialConfig || !socialConfig.pageAccessToken) {
    return res.status(400).json({ error: 'Social not configured for this salon.' });
  }

  try {
    let mid = `mid.mock_send_${Date.now()}`;
    const token = socialConfig.pageAccessToken;

    if (!token.startsWith('mock')) {
      // Send via Facebook Graph API (works for both Messenger and Instagram)
      const response = await axios.post(
        `https://graph.facebook.com/v21.0/me/messages?access_token=${token}`,
        {
          recipient: { id: psid },
          message: { text: content }
        }
      );
      mid = response.data.message_id;
    } else {
      console.log(`[Social Send] Offline simulation mode active. Skipping Facebook Graph API call.`);
    }

    // Save to history with correct platform tag
    const newMessage = await prisma.messageHistory.create({
      data: {
        tenantId,
        psid,
        senderId: platform === 'instagram' ? (socialConfig.igAccountId || socialConfig.pageId) : socialConfig.pageId,
        recipientId: psid,
        content,
        mid,
        direction: 'OUTBOUND',
        platform
      }
    });

    res.json(newMessage);
  } catch (error: any) {
    console.error('[Send Error]', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

/**
 * Get/Update Social Config
 */
router.get('/config/:tenantId', async (req, res) => {
  const config = await prisma.socialConfig.findUnique({
    where: { tenantId: req.params.tenantId }
  });
  res.json(config || {});
});

router.post('/config/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { pageId, pageAccessToken, verifyToken, igAccountId, isActive } = req.body;

  const config = await prisma.socialConfig.upsert({
    where: { tenantId },
    update: { 
      pageId, 
      pageAccessToken, 
      verifyToken, 
      igAccountId: igAccountId || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    },
    create: { 
      tenantId, 
      pageId, 
      pageAccessToken, 
      verifyToken, 
      igAccountId: igAccountId || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    }
  });

  res.json(config);
});

// --- HELPER FUNCTIONS ---

async function handleAutoReply(tenant: any, psid: string, text: string, accessToken: string, platform: string = 'facebook') {
  let reply = '';
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      console.log(`[AI Chatbot] Initiating Gemini AI analysis for tenant: "${tenant.name}"`);
      // 1. Fetch live Services & Working Hours from Database
      const services = await prisma.service.findMany({ where: { tenantId: tenant.id } });
      const staff = await prisma.staff.findMany({ where: { tenantId: tenant.id, status: 'ACTIVE' } });
      const bookingUrl = `${process.env.APP_URL || 'https://booking.salon'}/${tenant.slug}`;
      
      let formattedHours = 'Chúng tôi mở cửa từ 9:00 AM đến 7:00 PM hàng ngày.';
      if (tenant.workingHours) {
        try {
          const hours = JSON.parse(tenant.workingHours);
          formattedHours = Object.entries(hours)
            .map(([day, time]: any) => `${day}: ${time.start} - ${time.end}`)
            .join('\n');
        } catch (e) {}
      }

      // 2. Build personalized System Prompt
      const systemPrompt = `You are the receptionist at "${tenant.name}" nail salon. You respond via ${platform === 'instagram' ? 'Instagram DM' : 'Facebook Messenger'}.

SALON DATA:
Services: ${services.map(s => `${s.name} ($${s.price})`).join(', ')}
Staff: ${staff.map(st => `${st.name} - ${st.role}`).join(', ')}
Hours: ${formattedHours}
Booking: ${bookingUrl}

RULES:
- Be warm, concise (2-4 sentences max). Sound like a real receptionist, NOT an AI.
- Answer ONLY about our salon: services, prices, hours, staff, booking.
- If the customer asks about promotions or things not in our data, warmly invite them to leave their phone number for a personal callback.
- To book: always share the link ${bookingUrl}
- Match the customer's language (Vietnamese → Vietnamese, English → English).
- Do NOT repeat the full price list unless specifically asked. Just answer the specific question.
- Do NOT introduce yourself or the salon unless it's the very first message in the conversation.`;

      // 3. Fetch recent conversation history for context (last 10 messages)
      const recentHistory = await prisma.messageHistory.findMany({
        where: { tenantId: tenant.id, psid },
        orderBy: { timestamp: 'desc' },
        take: 10
      });
      
      // Build conversation context (oldest first) and MERGE consecutive roles
      // Gemini API strictly requires alternating 'user' and 'model' roles
      const rawRoles = recentHistory.reverse().map(msg => ({
        role: msg.direction === 'INBOUND' ? 'user' : 'model',
        text: msg.content
      }));

      // Add the current new message
      rawRoles.push({ role: 'user', text });

      const conversationContents: any[] = [];
      for (const msg of rawRoles) {
        const lastConv = conversationContents[conversationContents.length - 1];
        if (lastConv && lastConv.role === msg.role) {
          // Merge with previous if same role
          lastConv.parts[0].text += `\n${msg.text}`;
        } else {
          // Add new role block
          conversationContents.push({
            role: msg.role,
            parts: [{ text: msg.text }]
          });
        }
      }

      // 4. Request Gemini API with proper systemInstruction and generationConfig
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const geminiRes = await axios.post(
        geminiUrl,
        {
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: conversationContents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
            topP: 0.8
          }
        },
        { timeout: 10000 }
      );

      const aiReply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        reply = aiReply.trim();
        console.log(`[AI Chatbot] Successfully generated AI response (${reply.length} chars).`);
      }
    } catch (aiErr: any) {
      console.error('[AI Chatbot Error]', aiErr.response?.data || aiErr.message);
      // Fail-safe: Fallback to keyword matching if AI fails
    }
  }

  // Fail-safe Fallback: If Gemini is disabled or threw an error, use standard keyword rules
  if (!reply) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('giá') || lowerText.includes('price')) {
      const services = await prisma.service.findMany({ where: { tenantId: tenant.id } });
      if (services.length > 0) {
        reply = 'Bảng giá dịch vụ của chúng tôi:\n' + 
                services.map(s => `- ${s.name}: $${s.price}`).join('\n');
      } else {
        reply = 'Hiện tại chúng tôi chưa cập nhật bảng giá. Vui lòng liên hệ trực tiếp.';
      }
    } else if (lowerText.includes('giờ') || lowerText.includes('mở cửa') || lowerText.includes('open')) {
      if (tenant.workingHours) {
        try {
          const hours = JSON.parse(tenant.workingHours);
          reply = 'Giờ mở cửa của chúng tôi:\n' + 
                  Object.entries(hours).map(([day, time]: any) => `${day}: ${time.start} - ${time.end}`).join('\n');
        } catch (e) {
          reply = 'Chúng tôi mở cửa từ 9:00 AM đến 7:00 PM hàng ngày.';
        }
      } else {
        reply = 'Chúng tôi mở cửa từ 9:00 AM đến 7:00 PM hàng ngày.';
      }
    } else if (lowerText.includes('đặt') || lowerText.includes('book')) {
      const bookingUrl = `${process.env.APP_URL || 'https://booking.salon'}/${tenant.slug}`;
      reply = `Để đặt lịch nhanh chóng, bạn vui lòng truy cập: ${bookingUrl}`;
    } else {
      const bookingUrl = `${process.env.APP_URL || 'https://booking.salon'}/${tenant.slug}`;
      reply = `Xin chào! Tôi là trợ lý AI tự động của ${tenant.name}. Rất vui được hỗ trợ bạn. Để đặt lịch làm đẹp nhanh chóng, bạn vui lòng truy cập: ${bookingUrl}\nBạn cũng có thể hỏi tôi về 'bảng giá' hoặc 'giờ mở cửa' của tiệm nhé!`;
    }
  }

  if (reply) {
    try {
      let mid = `mid.mock_bot_${Date.now()}`;

      if (!accessToken.startsWith('mock')) {
        const response = await axios.post(
          `https://graph.facebook.com/v21.0/me/messages?access_token=${accessToken}`,
          {
            recipient: { id: psid },
            message: { text: reply }
          }
        );
        mid = response.data.message_id;
      } else {
        console.log(`[Social Auto-Reply] Offline simulation mode active. Skipping Facebook Graph API call.`);
      }

      await prisma.messageHistory.create({
        data: {
          tenantId: tenant.id,
          psid: psid,
          senderId: tenant.id, // Bot identification
          recipientId: psid,
          content: reply,
          mid: mid,
          direction: 'OUTBOUND',
          platform
        }
      });
    } catch (error: any) {
      console.error('[FB Auto-Reply Error]', error.response?.data || error.message);
    }
  }
}

export default router;
