// Utility functions
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function timeAgo(t) {
  if (!t) return '';
  const d = typeof t === 'number' ? new Date(t) : new Date(t);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  const binds = [
    ['tw-username', queryUser],
    ['kol-username', queryKOL],
    ['tweet-query', searchTweets],
    ['news-query', searchNews]
  ];
  binds.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
  });

  // Load trending data on page load
  loadTrending();
  loadTrendingNews();
});

// Tab switching
function switchTab(tab) {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.remove('hidden');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
}

// Load trending KOL tweets on landing page
async function loadTrending() {
  try {
    const res = await API.twitter('search', { keywords: 'crypto', minLikes: 500, product: 'Top', maxResults: 6 });
    if (res.success && res.data) {
      const tweets = Array.isArray(res.data) ? res.data : (res.data.tweets || []);
      const el = document.getElementById('trending-list');
      if (tweets.length === 0) { el.innerHTML = '<div class="text-center text-gray-500 col-span-3">No trending data available</div>'; return; }
      el.innerHTML = tweets.slice(0, 6).map(t => `
        <div class="card-anime rounded-2xl p-5 slide-up">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-anime-glow/30 to-anime-pink/30 flex items-center justify-center text-lg font-bold">${(t.userName || '?')[0]}</div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm truncate">${esc(t.userName || t.userScreenName || '')}</div>
              <div class="text-xs text-gray-500">@${t.userScreenName || ''} · ${formatNum(t.userFollowers || 0)} followers</div>
            </div>
            ${t.userVerified ? '<span class="text-anime-cyan text-xs">✓</span>' : ''}
          </div>
          <p class="text-sm text-gray-300 leading-relaxed mb-3 line-clamp-3">${esc((t.text || '').slice(0, 200))}</p>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span class="text-anime-pink">❤️ ${formatNum(t.favoriteCount || 0)}</span>
            <span class="text-anime-cyan">🔁 ${formatNum(t.retweetCount || 0)}</span>
            <span class="text-anime-yellow">💬 ${formatNum(t.replyCount || 0)}</span>
            <span class="ml-auto">${timeAgo(t.createdAt)}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Failed to load trending:', e);
  }
}

// Load trending news on landing page
async function loadTrendingNews() {
  try {
    const res = await API.news('search', { limit: 4, page: 1 });
    if (res.success && res.data) {
      const articles = Array.isArray(res.data) ? res.data : (res.data.data || res.data.list || []);
      const el = document.getElementById('trending-news-list');
      if (articles.length === 0) { el.innerHTML = '<div class="text-center text-gray-500 col-span-2">No news available</div>'; return; }
      el.innerHTML = articles.slice(0, 4).map(a => {
        const ai = a.aiRating || {};
        const signalText = ai.signal === 'long' ? '🟢 Bullish' : ai.signal === 'short' ? '🔴 Bearish' : '🟡 Neutral';
        const signalClass = ai.signal === 'long' ? 'text-green-400' : ai.signal === 'short' ? 'text-red-400' : 'text-yellow-400';
        return `
          <div class="card-anime rounded-2xl p-5 slide-up">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs text-gray-500">${esc(a.newsType || 'News')}</span>
              ${ai.score ? `<span class="text-xs font-bold ${ai.score >= 70 ? 'text-green-400' : ai.score >= 40 ? 'text-yellow-400' : 'text-red-400'}">Score: ${ai.score}</span>` : ''}
              ${ai.signal ? `<span class="text-xs ${signalClass}">${signalText}</span>` : ''}
            </div>
            <p class="text-sm text-gray-200 leading-relaxed mb-2 line-clamp-2">${esc((a.text || '').slice(0, 150))}</p>
            <div class="flex items-center gap-2">
              ${a.coins?.length ? a.coins.slice(0, 3).map(c => `<span class="text-xs bg-anime-glow/10 text-anime-glow px-2 py-0.5 rounded-full">${c.symbol}</span>`).join('') : ''}
              <span class="text-xs text-gray-600 ml-auto">${timeAgo(a.ts)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    console.error('Failed to load news:', e);
  }
}

// Twitter User Query
async function queryUser() {
  const username = document.getElementById('tw-username').value.trim().replace('@', '');
  if (!username) return;
  show('tw-loading'); hide('tw-result');
  const res = await API.twitter('user_info', { username });
  hide('tw-loading');
  if (res.success && res.data?.success) {
    const u = res.data;
    document.getElementById('tw-avatar').src = u.profileImageUrl?.replace('_normal', '_200x200') || '';
    document.getElementById('tw-name').textContent = u.name || username;
    document.getElementById('tw-screen').textContent = '@' + u.screenName;
    document.getElementById('tw-desc').textContent = u.description || '';
    document.getElementById('tw-followers').textContent = formatNum(u.followersCount || 0);
    document.getElementById('tw-following').textContent = formatNum(u.friendsCount || 0);
    document.getElementById('tw-tweets').textContent = formatNum(u.statusesCount || 0);
    if (u.verified) document.getElementById('tw-verified').classList.remove('hidden');
    else document.getElementById('tw-verified').classList.add('hidden');
    show('tw-result');
  }
}

// KOL Followers
async function queryKOL() {
  const username = document.getElementById('kol-username').value.trim().replace('@', '');
  if (!username) return;
  show('kol-loading'); hide('kol-list'); hide('kol-count'); hide('kol-empty');
  document.getElementById('kol-list').innerHTML = '';
  const res = await API.twitter('kol_followers', { username });
  hide('kol-loading');
  if (res.success && res.data) {
    const users = res.data.users || [];
    const total = res.data.totalCount || 0;
    if (total === 0) { show('kol-empty'); return; }
    document.getElementById('kol-count').textContent = `${total} KOL followers found for @${username}`;
    show('kol-count');
    const sorted = users.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
    document.getElementById('kol-list').innerHTML = sorted.map(u => `
      <div class="kol-card">
        <img src="${(u.profileImageUrl || '').replace('_normal', '_bigger')}" class="w-10 h-10 rounded-full flex-shrink-0 border border-anime-glow/20" onerror="this.style.display='none'">
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm truncate">${esc(u.name || u.screenName)}</div>
          <div class="text-xs text-gray-400">@${u.screenName} · ${formatNum(u.followersCount || 0)} followers</div>
        </div>
      </div>
    `).join('');
    show('kol-list');
  }
}

// Tweet Search
async function searchTweets() {
  const q = document.getElementById('tweet-query').value.trim();
  if (!q) return;
  show('tweet-loading');
  document.getElementById('tweet-list').innerHTML = '';
  const res = await API.twitter('search', { keywords: q, maxResults: 20, product: 'Top' });
  hide('tweet-loading');
  if (res.success && res.data) {
    const tweets = res.data.tweets || res.data || [];
    const list = Array.isArray(tweets) ? tweets : [];
    document.getElementById('tweet-list').innerHTML = list.map(t => `
      <div class="tweet-card">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-bold text-sm">${esc(t.userName || t.userScreenName || '')}</span>
          <span class="text-xs text-gray-500">@${t.userScreenName || ''}</span>
          <span class="text-xs text-gray-600">${timeAgo(t.createdAt)}</span>
        </div>
        <p class="text-sm text-gray-300">${esc(t.text || '')}</p>
        <div class="flex gap-4 mt-2 text-xs text-gray-500">
          <span class="text-anime-pink">❤️ ${formatNum(t.favoriteCount || 0)}</span>
          <span class="text-anime-cyan">🔁 ${formatNum(t.retweetCount || 0)}</span>
          <span class="text-anime-yellow">💬 ${formatNum(t.replyCount || 0)}</span>
        </div>
      </div>
    `).join('') || '<div class="text-center py-8 text-gray-500">No tweets found.</div>';
  }
}

// News Search
async function searchNews() {
  const q = document.getElementById('news-query').value.trim();
  const coin = document.getElementById('news-coin').value;
  show('news-loading');
  document.getElementById('news-list').innerHTML = '';
  const params = { limit: 20, page: 1 };
  if (q) params.q = q;
  if (coin) params.coins = [coin];
  const res = await API.news('search', params);
  hide('news-loading');
  if (res.success && res.data) {
    const articles = Array.isArray(res.data) ? res.data : (res.data.data || res.data.list || []);
    document.getElementById('news-list').innerHTML = articles.map(a => {
      const ai = a.aiRating || {};
      const scoreClass = (ai.score >= 70) ? 'score-high' : (ai.score >= 40) ? 'score-mid' : 'score-low';
      const signalText = ai.signal === 'long' ? '🟢 Bullish' : ai.signal === 'short' ? '🔴 Bearish' : '🟡 Neutral';
      const signalClass = ai.signal === 'long' ? 'signal-long' : ai.signal === 'short' ? 'signal-short' : 'signal-neutral';
      return `
        <div class="news-card">
          ${ai.score ? `<div class="score-badge ${scoreClass} flex-shrink-0">${ai.score}</div>` : ''}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-gray-500">${esc(a.newsType || '')}</span>
              ${ai.signal ? `<span class="text-xs px-2 py-0.5 rounded-full ${signalClass}">${signalText}</span>` : ''}
              <span class="text-xs text-gray-600">${timeAgo(a.ts)}</span>
            </div>
            <p class="text-sm text-gray-200">${esc(a.text || '')}</p>
            ${a.coins?.length ? `<div class="flex gap-1 mt-2">${a.coins.map(c => `<span class="text-xs bg-anime-glow/10 text-anime-glow px-2 py-0.5 rounded-full">${c.symbol}</span>`).join('')}</div>` : ''}
            ${a.link ? `<a href="${esc(a.link)}" target="_blank" class="text-xs text-anime-cyan hover:underline mt-1 inline-block">Read more →</a>` : ''}
          </div>
        </div>
      `;
    }).join('') || '<div class="text-center py-8 text-gray-500">No news found.</div>';
  }
}
