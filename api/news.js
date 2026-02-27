const TOKEN = process.env.TWITTER_TOKEN;
const BASE = 'https://ai.6551.io/open';

async function proxy(endpoint, body, res, method = 'POST') {
  try {
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    if (method === 'POST') opts.body = JSON.stringify(body);
    const r = await fetch(`${BASE}/${endpoint}`, opts);
    const data = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, ...params } = req.body || {};

  if (action === 'sources' || req.method === 'GET') {
    return proxy('news_type', {}, res, 'GET');
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (action === 'search') {
    return proxy('news_search', params, res);
  }
  return res.status(400).json({ error: 'Invalid action' });
}
