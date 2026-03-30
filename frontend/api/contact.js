// Vercel Serverless Function — proxies contact form to Web3Forms
// Keeps the API key server-side so it's never exposed in the client bundle

const RATE_LIMIT = new Map(); // IP -> { count, resetAt }

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.SITE_URL || 'https://jcabidoy.xyz');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting: 5 requests per IP per 10 minutes
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 5) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    entry.count++;
  } else {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
  }

  // Validate input
  const { name, email, message, project, preferredDate } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, message' });
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Forward to Web3Forms with server-side key
  const web3formsKey = process.env.WEB3FORMS_KEY;
  if (!web3formsKey) {
    return res.status(500).json({ error: 'Contact form not configured' });
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: `New Contact from ${name}`,
        from_name: name,
        email,
        message: `Project: ${project || 'Not specified'}\nPreferred Date: ${preferredDate || 'Not selected'}\n\n${message}`,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return res.status(200).json({ success: true });
    }
    return res.status(response.status).json({ error: data.message || 'Failed to send' });
  } catch (err) {
    console.error('Web3Forms proxy error:', err);
    return res.status(502).json({ error: 'Failed to reach email service' });
  }
}
