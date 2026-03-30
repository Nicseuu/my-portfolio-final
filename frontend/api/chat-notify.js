// Vercel Serverless Function — sends chat notification emails
// Keeps the Web3Forms key server-side

const RATE_LIMIT = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.SITE_URL || 'https://jcabidoy.xyz');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting: 10 requests per IP per 5 minutes
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 10) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    entry.count++;
  } else {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
  }

  const { visitorName, visitorEmail, message } = req.body || {};
  if (!visitorName || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const web3formsKey = process.env.WEB3FORMS_KEY;
  if (!web3formsKey) {
    return res.status(200).json({ success: true, notified: false });
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: `New Chat Message from ${visitorName}`,
        from_name: visitorName,
        email: visitorEmail || 'Not provided',
        message: `Chat message from ${visitorName}:\n\n${message}`,
      }),
    });

    return res.status(200).json({ success: true, notified: response.ok });
  } catch {
    return res.status(200).json({ success: true, notified: false });
  }
}
