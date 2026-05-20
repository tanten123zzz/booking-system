export async function sendSmsPromotion(to: string[], message: string): Promise<{ success: boolean; count?: number; failedCount?: number; warning?: string; error?: string }> {
  try {
    const controller = new AbortController();

    console.log("Calling fetch /api/sms/send with", { to, message });

    const fetchPromise = fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, message }),
      signal: controller.signal
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error('Frontend explicit timeout occurred after 12 seconds.'));
      }, 12000);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

    const data = await response.json().catch(err => {
       console.error("response.json() threw:", err);
       return null;
    });

    console.log("data received:", data);

    if (!response.ok) {
      throw new Error(data?.error || `Server responded with status: ${response.status}`);
    }

    if (!data) {
      throw new Error('Server returned an empty or invalid API response.');
    }

    return data;
  } catch (error: any) {
    console.error('Error in sendSmsPromotion calling action:', error);
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return { success: false, error: 'Request timed out. The server is taking too long to respond.' };
    }
    return { success: false, error: error.message || 'Unknown error occurred while contacting backend.' };
  }
}




