const TOKEN = process.env.TWITTER_TOKEN;
const BASE = 'https://ai.6551.io/open';

async function proxy(endpoint, body, res) {
  try {
    const r = await fetch(`${BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { action, ...params } = req.body || {};

  const routes = {
    'user_info': 'twitter_user_info',
    'kol_followers': 'twitter_kol_followers',
    'search': 'twitter_search',
    'user_tweets': 'twitter_user_tweets',
    'follower_events': 'twitter_follower_events',
    'deleted_tweets': 'twitter_deleted_tweets'
  };

  const endpoint = routes[action];
  if (!endpoint) return res.status(400).json({ error: 'Invalid action' });

  return proxy(endpoint, params, res);
}
