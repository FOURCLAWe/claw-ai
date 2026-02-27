const API = {
  async twitter(action, params) {
    const r = await fetch('/api/twitter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params })
    });
    return r.json();
  },

  async news(action, params) {
    const r = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params })
    });
    return r.json();
  }
};
