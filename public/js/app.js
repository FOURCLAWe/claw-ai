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

  // Auto-load news on tab switch
  const origSwitch = window.switchTab;
  window.switchTab = (tab) => {
    origSwitch(tab);
    if (tab === 'news' && document.getElementById('news-list').innerHTML === '') {
      searchNews();
    }
  };
});

// Tab switching
function switchTab(tab) {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.remove('hidden');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
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

    if (total === 0) {
      show('kol-empty');
      return;
    }

    document.getElementById('kol-count').textContent = `${total} KOL followers found for @${username}`;
    show('kol-count');

    const sorted = users.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
    const html = sorted.map(u => `
      <div class="kol-card">
        <img src="${(u.profileImageUrl || '').replace('_normal', '_bigger')}" class="w-10 h-10 rounded-full flex-shrink-0" onerror="this.style.display='none'">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1">
            <span class="font-medium text-sm truncate">${esc(u.name || u.screenName)}</span>
          </div>
          <div class="text-xs text-gray-400">@${u.screenName} · ${formatNum(u.followersCount || 0)} followers</div>
        </div>
      </div>
    `).join('');

    document.getElementById('kol-list').innerHTML = html;
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

    const html = list.map(t => `
      <div class="tweet-card">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-medium text-sm">${esc(t.userName || t.userScreenName || '')}</span>
          <span class="text-xs text-gray-500">@${t.userScreenName || ''}</span>
          <span class="text-xs text-gray-600">${timeAgo(t.createdAt)}</span>
        </div>
        <p class="text-sm text-gray-300">${esc(t.text || '')}</p>
        <div class="flex gap-4 mt-2 text-xs text-gray-500">
          <span>❤️ ${formatNum(t.favoriteCount || 0)}</span>
          <span>🔁 ${formatNum(t.retweetCount || 0)}</span>
          <span>💬 ${formatNum(t.replyCount || 0)}</span>
        </div>
      </div>
    `).join('');

    document.getElementById('tweet-list').innerHTML = html || '<div class="text-center py-8 text-gray-500">No tweets found.</div>';
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

    const html = articles.map(a => {
      const ai = a.aiRating || {};
      const scoreClass = (ai.score >= 70) ? 'score-high' : (ai.score >= 40) ? 'score-mid' : 'score-low';
      const signalClass = ai.signal === 'long' ? 'signal-long' : ai.signal === 'short' ? 'signal-short' : 'signal-neutral';
      const signalText = ai.signal === 'long' ? '🟢 Bullish' : ai.signal === 'short' ? '🔴 Bearish' : '🟡 Neutral';

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
            ${a.coins?.length ? `<div class="flex gap-1 mt-2">${a.coins.map(c => `<span class="text-xs bg-accent-500/10 text-accent-400 px-2 py-0.5 rounded-full">${c.symbol}</span>`).join('')}</div>` : ''}
            ${a.link ? `<a href="${esc(a.link)}" target="_blank" class="text-xs text-accent-400 hover:underline mt-1 inline-block">Read more →</a>` : ''}
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('news-list').innerHTML = html || '<div class="text-center py-8 text-gray-500">No news found.</div>';
  }
}
