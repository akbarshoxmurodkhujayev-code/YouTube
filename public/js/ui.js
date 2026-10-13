const UI = {
  /**
   * Loading holatini ko'rsatish
   */
  showLoading() {
    document.getElementById('content').innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    `;
  },

  /**
   * Xato xabarini ko'rsatish
   */
  showError(message) {
    document.getElementById('content').innerHTML = `
      <div class="error-message">
        <h2>⚠️ Xatolik</h2>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
  },

  /**
   * Bo'sh natija
   */
  showEmpty(query) {
    document.getElementById('content').innerHTML = `
      <div class="error-message">
        <h2>😕 Hech narsa topilmadi</h2>
        <p>"${this.escapeHtml(query)}" bo'yicha natija yo'q.</p>
      </div>
    `;
  },

  /**
   * Videolarni grid'ga chiqarish (avatarlar bilan)
   */
  renderVideos(videos, channelsMap = {}) {
    const content = document.getElementById('content');
    if (!videos || videos.length === 0) {
      this.showEmpty(STATE.currentQuery);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'video-grid';

    videos.forEach(video => {
      if (!video.snippet || !video.id) return;
      grid.appendChild(this.createVideoCard(video, channelsMap));
    });

    content.innerHTML = '';
    content.appendChild(grid);
  },

  /**
   * Bitta video kartochkasi (avatarlar bilan)
   */
  createVideoCard(video, channelsMap = {}) {
    const title = video.snippet.title || 'Nomsiz';
    const channelName = video.snippet.channelTitle || 'Noma\'lum';
    const channelId = video.snippet.channelId || '';
    const channelAvatar = channelsMap[channelId] || '';
    const thumbnail = video.snippet.thumbnails?.high?.url
      || video.snippet.thumbnails?.medium?.url
      || video.snippet.thumbnails?.default?.url || '';

    const duration = this.formatDuration(video.contentDetails?.duration || '');
    const views = video.statistics?.viewCount
      ? this.formatViews(parseInt(video.statistics.viewCount)) + " ko'rishlar"
      : '';
    const letter = channelName.charAt(0).toUpperCase();

    // Avatar HTML — rasm yoki harf
    const avatarHTML = channelAvatar
      ? `<img src="${channelAvatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`
      : letter;

    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
      <div class="thumbnail-container">
        <img src="${thumbnail}" alt="${this.escapeHtml(title)}" loading="lazy">
        ${duration ? `<span class="duration">${duration}</span>` : ''}
      </div>
      <div class="video-info">
        <div class="channel-avatar" style="overflow:hidden;">${avatarHTML}</div>
        <div class="video-meta">
          <div class="video-title">${this.escapeHtml(title)}</div>
          <div class="channel-name">${this.escapeHtml(channelName)}</div>
          ${views ? `<div class="video-stats">${views}</div>` : ''}
        </div>
      </div>
    `;

    card.onclick = () => Router.navigate(`/watch/${video.id}`);
    return card;
  },

  /**
   * ISO 8601 davomiylikni formatlash: PT1H2M3S -> 1:02:03
   */
  formatDuration(iso) {
    if (!iso) return '';
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return '';
    const h = m[1] || '', mi = m[2] || '0', s = m[3] || '0';
    if (h) return `${h}:${mi.padStart(2, '0')}:${s.padStart(2, '0')}`;
    return `${mi}:${s.padStart(2, '0')}`;
  },

  /**
   * Ko'rishlar sonini formatlash: 1234567 -> 1.2M
   */
  formatViews(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  },

  /**
   * Nisbiy vaqt: "3 kun oldin"
   */
  formatDate(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return 'hozirgina';
    if (diff < 3600) return Math.floor(diff / 60) + ' daqiqa oldin';
    if (diff < 86400) return Math.floor(diff / 3600) + ' soat oldin';
    if (diff < 2592000) return Math.floor(diff / 86400) + ' kun oldin';
    if (diff < 31536000) return Math.floor(diff / 2592000) + ' oy oldin';
    return Math.floor(diff / 31536000) + ' yil oldin';
  },

  /**
   * XSS himoyasi uchun HTML escape
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};  