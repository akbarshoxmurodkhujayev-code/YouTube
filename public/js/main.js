let scrollListenerAttached = false;

/**
 * Videolarni yuklash (avatarlar bilan)
 */
async function loadVideos(query, pageToken = '', append = false) {
  STATE.currentQuery = query;
  STATE.isLoading = true;

  if (!append) {
    UI.showLoading();
  } else {
    showBottomLoader();
  }

  try {
    const result = await YouTubeAPI.fetchVideos(query, pageToken);

    let videos = [];
    let nextToken = '';

    if (Array.isArray(result)) {
      videos = result;
    } else if (result && typeof result === 'object') {
      videos = result.videos || [];
      nextToken = result.nextPageToken || '';
    }

    if (videos.length === 0) {
      if (!append) UI.showEmpty(query);
      else hideBottomLoader();
      return;
    }

    // ✅ KANAL AVATARLARINI YUKLASH (batch)
    const channelIds = [...new Set(videos.map(v => v.snippet?.channelId).filter(Boolean))];
    let channelsMap = {};
    if (channelIds.length) {
      try {
        const channels = await YouTubeAPI.getChannelsByIds(channelIds);
        channels.forEach(ch => {
          const avatar =
            ch.snippet?.thumbnails?.medium?.url ||
            ch.snippet?.thumbnails?.default?.url ||
            ch.snippet?.thumbnails?.high?.url ||
            '';
          if (avatar) channelsMap[ch.id] = avatar;
        });
        console.log(`✅ ${Object.keys(channelsMap).length} ta avatar yuklandi`);
      } catch (e) {
        console.warn('Avatarlar olinmadi:', e);
      }
    }

    if (append) {
      appendVideos(videos, channelsMap);
      hideBottomLoader();
    } else {
      UI.renderVideos(videos, channelsMap);
      attachScrollListener();
    }

    STATE.nextPageToken = nextToken;
  } catch (error) {
    console.error('Xatolik:', error);
    if (!append) UI.showError(error.message);
    else hideBottomLoader();
  } finally {
    STATE.isLoading = false;
  }
}

/**
 * Pastga yana videolar qo'shish (avatarlar bilan)
 */
function appendVideos(videos, channelsMap = {}) {
  const grid = document.querySelector('.video-grid');
  if (!grid) return;

  videos.forEach(video => {
    if (!video.snippet || !video.id) return;
    const card = UI.createVideoCard(video, channelsMap);
    grid.appendChild(card);
  });
}

/**
 * Scroll hodisasi — pastga yetganda yana yuklash
 */
function attachScrollListener() {
  if (scrollListenerAttached) return;
  scrollListenerAttached = true;

  window.addEventListener('scroll', () => {
    const page = STATE.currentPage;
    if (page !== 'home' && page !== 'search') return;
    if (STATE.isLoading) return;
    if (!STATE.nextPageToken) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= docHeight - 500) {
      loadVideos(STATE.currentQuery, STATE.nextPageToken, true);
    }
  });
}

/**
 * Pastdagi spinner
 */
function showBottomLoader() {
  if (document.getElementById('bottomLoader')) return;
  const loader = document.createElement('div');
  loader.id = 'bottomLoader';
  loader.className = 'loading';
  loader.style.padding = '40px 20px';
  loader.innerHTML = `
    <div class="spinner"></div>
    <p>Yana yuklanmoqda...</p>
  `;
  document.getElementById('content').appendChild(loader);
}

function hideBottomLoader() {
  document.getElementById('bottomLoader')?.remove();
}

/**
 * Qidiruv
 */
function handleSearch() {
  const input = document.getElementById('searchInput');
  const query = input.value.trim();
  if (!query) return;
  Router.navigate(`/search/${encodeURIComponent(query)}`);
}

/**
 * Sidebar yig'ish/yozish
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
  } else {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
  }
}

/**
 * Hodisalarni ulash
 */
function initEventListeners() {
  document.getElementById('searchBtn').addEventListener('click', handleSearch);

  document.getElementById('searchInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') handleSearch();
  });

  document.getElementById('menuBtn').addEventListener('click', toggleSidebar);

  document.getElementById('logoBtn').addEventListener('click', e => {
    e.preventDefault();
    Router.navigate('/');
  });

  document.querySelectorAll('.nav-item[data-query]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      STATE.nextPageToken = '';
      loadVideos(item.dataset.query);
    });
  });
}

/**
 * Ilovani ishga tushirish
 */
function init() {
  initEventListeners();
  Router.init();
}

document.addEventListener('DOMContentLoaded', init);