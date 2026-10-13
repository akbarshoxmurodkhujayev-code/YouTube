const Router = {
  navigate(path) {
    if (window.location.hash === `#${path}`) this.handleRoute();
    else window.location.hash = path;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);

    window.scrollTo({ top: 0 });
    document.getElementById('sidebar')?.classList.remove('mobile-open');

    // ✅ Shorts sahifasidan chiqqanda tozalash
    if (STATE.currentPage === 'shorts' && parts[0] !== 'shorts') {
      if (typeof ShortsPage !== 'undefined') ShortsPage.cleanup();
      document.body.classList.remove('shorts-mode');
    }

    // Bosh sahifa
    if (parts.length === 0 || parts[0] === '') {
      this.setActive('home');
      STATE.currentPage = 'home';
      loadVideos('trending');
      return;
    }

    // Shorts
    if (parts[0] === 'shorts') {
      this.setActive('shorts');
      STATE.currentPage = 'shorts';
      document.body.classList.add('shorts-mode');
      if (typeof ShortsPage !== 'undefined') ShortsPage.render();
      return;
    }

    // Video ko'rish
    if (parts[0] === 'watch' && parts[1]) {
      this.setActive('home');
      STATE.currentPage = 'watch';
      if (typeof VideoPage !== 'undefined') VideoPage.render(parts[1]);
      return;
    }

    // Qidiruv
    if (parts[0] === 'search' && parts[1]) {
      this.setActive('home');
      const query = decodeURIComponent(parts[1]);
      document.getElementById('searchInput').value = query;
      STATE.currentPage = 'search';
      STATE.currentQuery = query;
      loadVideos(query);
      return;
    }

    // Tarix
    if (parts[0] === 'history') {
      this.setActive('history');
      STATE.currentPage = 'history';
      this.renderHistory();
      return;
    }

    // Kutubxona
    if (parts[0] === 'library') {
      this.setActive('library');
      STATE.currentPage = 'library';
      this.renderLibrary();
      return;
    }

    // Obunalar
    if (parts[0] === 'subscriptions') {
      this.setActive('subscriptions');
      STATE.currentPage = 'subscriptions';
      this.renderSubscriptions();
      return;
    }

    // Kategoriya (music, gaming, news, ...)
    this.setActive(parts[0]);
    STATE.currentPage = parts[0];
    loadVideos(parts[0]);
  },

  setActive(page) {
    document.querySelectorAll('.nav-item, .mobile-nav__item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
  },

  renderHistory() {
    const content = document.getElementById('content');
    const history = Storage.getHistory();

    if (!history.length) {
      content.innerHTML = `
        <div class="error-message">
          <h2>🕐 Tarix bo'sh</h2>
          <p>Hozircha hech qanday video ko'rmadingiz.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 22px;">Ko'rish tarixi</h2>
        <button id="clearHistoryBtn" class="action-btn">Tarixni tozalash</button>
      </div>
      <div class="video-grid">
    `;

    history.forEach(v => {
      html += `
        <div class="video-card" data-video-id="${v.id}">
          <div class="thumbnail-container">
            <img src="${v.thumbnail}" alt="${UI.escapeHtml(v.title)}">
          </div>
          <div class="video-info">
            <div class="channel-avatar">${(v.channelTitle || 'U').charAt(0)}</div>
            <div class="video-meta">
              <div class="video-title">${UI.escapeHtml(v.title)}</div>
              <div class="channel-name">${UI.escapeHtml(v.channelTitle || '')}</div>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    content.innerHTML = html;

    content.querySelectorAll('.video-card').forEach(card => {
      card.onclick = () => Router.navigate(`/watch/${card.dataset.videoId}`);
    });

    document.getElementById('clearHistoryBtn').onclick = () => {
      if (confirm('Tarixni tozalashni xohlaysizmi?')) {
        Storage.clearHistory();
        this.renderHistory();
      }
    };
  },

  renderLibrary() {
    const content = document.getElementById('content');
    const list = Storage.getWatchLater();

    if (!list.length) {
      content.innerHTML = `
        <div class="error-message">
          <h2>📚 Kutubxona bo'sh</h2>
          <p>"Keyinroq ko'rish" ro'yxatiga hali video qo'shmadingiz.</p>
        </div>
      `;
      return;
    }

    let html = '<h2 style="font-size: 22px; margin-bottom: 20px;">Keyinroq ko\'rish</h2><div class="video-grid">';

    list.forEach(v => {
      html += `
        <div class="video-card" data-video-id="${v.id}">
          <div class="thumbnail-container">
            <img src="${v.thumbnail}" alt="${UI.escapeHtml(v.title)}">
          </div>
          <div class="video-info">
            <div class="channel-avatar">${(v.channelTitle || 'U').charAt(0)}</div>
            <div class="video-meta">
              <div class="video-title">${UI.escapeHtml(v.title)}</div>
              <div class="channel-name">${UI.escapeHtml(v.channelTitle || '')}</div>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    content.innerHTML = html;

    content.querySelectorAll('.video-card').forEach(card => {
      card.onclick = () => Router.navigate(`/watch/${card.dataset.videoId}`);
    });
  },

  renderSubscriptions() {
    const content = document.getElementById('content');
    const subs = Storage.getSubscriptions();

    if (!subs.length) {
      content.innerHTML = `
        <div class="error-message">
          <h2>📺 Obunalar bo'sh</h2>
          <p>Hozircha hech qanday kanalga obuna bo'lmadingiz.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <h2 style="font-size: 22px; margin-bottom: 20px;">Obunalar (${subs.length})</h2>
      <p style="color: #aaa;">Siz obuna bo'lgan kanallar ID: ${subs.join(', ')}</p>
    `;
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }
};