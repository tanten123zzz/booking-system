import axios from 'axios';

async function main() {
  try {
    const response = await axios.get('http://127.0.0.1:4040/api/requests/http');
    const requests = response.data.requests || [];
    console.log('--- TUNNEL WEBHOOK REQUESTS ---');
    
    const webhookReqs = requests.filter((r: any) => 
      r.request?.uri && (r.request.uri.includes('webhook') || r.request.uri.includes('facebook'))
    );

    console.log(`Found ${webhookReqs.length} webhook/facebook requests.`);

    for (const req of webhookReqs) {
      console.log(`[${req.request.method}] ${req.request.uri} -> Status: ${req.response?.status}`);
      if (req.request.method === 'POST') {
        console.log('Headers:', JSON.stringify(req.request.headers || {}));
        console.log('Request body snippet:', JSON.stringify(req.request.body || {}).substring(0, 400));
        console.log('Response body snippet:', JSON.stringify(req.response?.body || {}).substring(0, 400));
      }
    }
  } catch (error: any) {
    console.error('Could not fetch ngrok API:', error.message);
  }
}

main();
