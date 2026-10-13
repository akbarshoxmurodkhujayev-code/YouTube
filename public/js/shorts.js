const ShortsPage = {
  videos: [],
  players: {},
  observer: null,
  currentIndex: 0,
  channelsMap: {},

  async render() {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="shorts-page">
        <div class="shorts-container" id="shortsContainer">
          <div class="loading" style="height: 100%;">
            <div class="spinner"></div>
            <p style="color: #fff;">Shorts yuklanmoqda...</p>
          </div>
        </div>
      </div>
    `;

    try {
      await this.loadYouTubeAPI();
      const videos = await YouTubeAPI.getShorts();
      if (!videos.length) throw new Error('Shorts topilmadi');
      this.videos = videos;
      await this.loadChannelAvatars();
      this.renderShorts();
    } catch (error) {
      document.getElementById('shortsContainer').innerHTML = `
        <div style="color: #fff; text-align: center; padding: 60px 20px;">
          <h2>⚠️ ${error.message}</h2>
        </div>
      `;
    }
  },

  async loadChannelAvatars() {
    const channelIds = [...new Set(
      this.videos.map(v => v.snippet?.channelId).filter(Boolean)
    )];

    if (!channelIds.length) return;

    try {
      const channels = await YouTubeAPI.getChannelsByIds(channelIds);
      channels.forEach(ch => {
        const avatar =
          ch.snippet?.thumbnails?.medium?.url ||
          ch.snippet?.thumbnails?.default?.url ||
          ch.snippet?.thumbnails?.high?.url ||
          '';
        if (avatar) this.channelsMap[ch.id] = avatar;
      });
      console.log(`✅ ${Object.keys(this.channelsMap).length} ta avatar yuklandi`);
    } catch (e) {
      console.warn('Avatarlar olinmadi:', e);
    }
  },

  loadYouTubeAPI() {
    return new Promise(resolve => {
      if (window.YT && window.YT.Player) return resolve();
      window.onYouTubeIframeAPIReady = () => resolve();
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
  },

  renderShorts() {
    const container = document.getElementById('shortsContainer');
    container.innerHTML = '';

    this.videos.forEach((video, index) => {
      container.appendChild(this.createShortItem(video, index));
    });

    setTimeout(() => this.playVideoAtIndex(0), 500);

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          const i = parseInt(entry.target.dataset.index);
          if (this.currentIndex !== i) this.playVideoAtIndex(i);
        }
      });
    }, { root: container, threshold: [0.6] });

    container.querySelectorAll('.short-item').forEach(el => this.observer.observe(el));
  },

  createShortItem(video, index) {
    const title = video.snippet.title || '';
    const channelName = video.snippet.channelTitle || '';
    const channelId = video.snippet.channelId || '';
    const channelAvatar = this.channelsMap[channelId] || '';
    const likes = video.statistics?.likeCount ? UI.formatViews(parseInt(video.statistics.likeCount)) : '0';
    const comments = video.statistics?.commentCount ? UI.formatViews(parseInt(video.statistics.commentCount)) : '0';
    const letter = channelName.charAt(0).toUpperCase();

    const isLiked = Storage.isLiked(video.id);
    const isDisliked = Storage.isDisliked(video.id);
    const isSubscribed = Storage.isSubscribed(channelId);

    // Avatar HTML
    const avatarHTML = channelAvatar
      ? `<img src="${channelAvatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`
      : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;">${letter}</span>`;

    const item = document.createElement('div');
    item.className = 'short-item';
    item.dataset.index = index;
    item.dataset.videoId = video.id;

    item.innerHTML = `
      <div class="short-item__player-wrapper">
        <div id="player-${video.id}" style="width:100%;height:100%;"></div>
        <div class="short-item__overlay"></div>
        <div class="short-item__gradient"></div>
      </div>

      <div class="short-info">
        <div class="short-info__channel">
          <div class="short-action__avatar" style="width:36px;height:36px;font-size:16px;overflow:hidden;">
            ${avatarHTML}
          </div>
          <span class="short-info__channel-name">@${UI.escapeHtml(channelName)}</span>
          <button class="short-info__subscribe-btn ${isSubscribed ? 'subscribed' : ''}" data-action="subscribe">
            ${isSubscribed ? 'Obuna bo\'ldingiz' : 'Obuna'}
          </button>
        </div>
        <div class="short-info__title">${UI.escapeHtml(title)}</div>
        <div class="short-info__music">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 3v10.5A3.5 3.5 0 1 0 14 17V7h4V3h-6z"/>
          </svg>
          Original audio
        </div>
      </div>

      <div class="short-actions">
        <!-- Kanal avatar -->
        <button class="short-action short-action--channel ${isSubscribed ? 'subscribed' : ''}" data-action="channel">
          <div class="short-action__icon" style="background:transparent;backdrop-filter:none;box-shadow:none;padding:0;position:relative;">
            <div class="short-action__avatar" style="overflow:hidden;">
              ${avatarHTML}
            </div>
            <div class="short-action__subscribe">${isSubscribed ? '✓' : '+'}</div>
          </div>
        </button>

        <!-- LIKE -->
        <button class="short-action ${isLiked ? 'liked' : ''}" data-action="like">
          <div class="short-action__icon">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1L14.3 1 7.6 7.6c-.4.3-.6.8-.6 1.4v10c0 1.1.9 2 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7c.1-.2.2-.5.2-.8v-2z"/>
            </svg>
          </div>
          <span class="short-action__label">${likes}</span>
        </button>

        <!-- DISLIKE -->
        <button class="short-action ${isDisliked ? 'disliked' : ''}" data-action="dislike">
          <div class="short-action__icon">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
              <path d="M15 3H6c-.8 0-1.5.5-1.8 1.2l-3 7c-.1.2-.2.5-.2.8v2c0 1.1.9 2 2 2h6.3l-1 4.6v.3c0 .4.2.8.4 1l1.1 1 6.7-6.6c.4-.3.6-.8.6-1.4V5c0-1.1-.9-2-2-2zm5 0v12h4V3h-4z"/>
            </svg>
          </div>
          <span class="short-action__label">Yomon</span>
        </button>

        <!-- IZOHLAR — endi bosilganda hech narsa bo'lmaydi -->
        <button class="short-action" data-action="comments">
          <div class="short-action__icon">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <span class="short-action__label">${comments}</span>
        </button>

        <!-- ULASHISH -->
        <button class="short-action" data-action="share">
          <div class="short-action__icon">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
              <path d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.1c.1-.3.1-.5.1-.8s0-.5-.1-.8l7-4.1c.6.5 1.3.8 2.1.8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .3 0 .5.1.8L8.1 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2.1-.8l7.1 4.1c-.1.3-.1.5-.1.8 0 1.6 1.3 3 3 3s3-1.3 3-3-1.4-3-3-3z"/>
            </svg>
          </div>
          <span class="short-action__label">Ulashish</span>
        </button>
      </div>
    `;

    // Tugmalar
    item.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;

        if (action === 'like') {
          const nowLiked = Storage.toggleLike(video.id);
          btn.classList.toggle('liked', nowLiked);
          const dislikeBtn = item.querySelector('[data-action="dislike"]');
          if (nowLiked && dislikeBtn) dislikeBtn.classList.remove('disliked');
        }

        if (action === 'dislike') {
          const nowDisliked = Storage.toggleDislike(video.id);
          btn.classList.toggle('disliked', nowDisliked);
          const likeBtn = item.querySelector('[data-action="like"]');
          if (nowDisliked && likeBtn) likeBtn.classList.remove('liked');
        }

        if (action === 'subscribe' || action === 'channel') {
          const nowSubscribed = Storage.toggleSubscription(channelId);
          const subBtn = item.querySelector('[data-action="subscribe"]');
          if (subBtn) {
            subBtn.textContent = nowSubscribed ? 'Obuna bo\'ldingiz' : 'Obuna';
            subBtn.classList.toggle('subscribed', nowSubscribed);
          }
          const channelBtn = item.querySelector('[data-action="channel"]');
          if (channelBtn) {
            channelBtn.classList.toggle('subscribed', nowSubscribed);
            const plusIcon = channelBtn.querySelector('.short-action__subscribe');
            if (plusIcon) plusIcon.textContent = nowSubscribed ? '✓' : '+';
          }
        }

        if (action === 'share') {
          const url = `https://youtube.com/shorts/${video.id}`;
          if (navigator.share) {
            navigator.share({ title, url }).catch(() => {});
          } else if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
            const label = btn.querySelector('.short-action__label');
            const original = label.textContent;
            label.textContent = 'Nusxalandi!';
            setTimeout(() => label.textContent = original, 1500);
          }
        }

        // ✅ IZOH tugmasi — hech narsa qilmaydi
        if (action === 'comments') {
          return;
        }
      });
    });

    item.querySelector('.short-item__overlay').addEventListener('click', () => this.togglePlay(video.id));
    return item;
  },

  createPlayer(videoId, elementId) {
    if (this.players[videoId]) return this.players[videoId];
    const player = new YT.Player(elementId, {
      videoId,
      playerVars: {
        autoplay: 0, controls: 0, modestbranding: 1, rel: 0,
        playsinline: 1, loop: 1, playlist: videoId, fs: 0, disablekb: 1
      },
      events: {
        onReady: e => { e.target.mute(); e.target.playVideo(); },
        onStateChange: e => {
          if (e.data === YT.PlayerState.ENDED) {
            e.target.seekTo(0);
            e.target.playVideo();
          }
        }
      }
    });
    this.players[videoId] = player;
    return player;
  },

  playVideoAtIndex(index) {
    if (index < 0 || index >= this.videos.length) return;
    const video = this.videos[index];
    const el = document.getElementById(`player-${video.id}`);
    if (!el) return;

    if (!this.players[video.id]) this.createPlayer(video.id, `player-${video.id}`);
    else this.players[video.id].playVideo();

    Object.keys(this.players).forEach(id => {
      if (id !== video.id && this.players[id]?.pauseVideo) {
        try { this.players[id].pauseVideo(); } catch (e) {}
      }
    });

    this.currentIndex = index;
  },

  togglePlay(videoId) {
    const p = this.players[videoId];
    if (!p) return;
    if (p.getPlayerState() === YT.PlayerState.PLAYING) p.pauseVideo();
    else p.playVideo();
  },

  cleanup() {
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    Object.values(this.players).forEach(p => { try { p?.destroy(); } catch (e) {} });
    this.players = {};
    this.videos = [];
    this.channelsMap = {};
    this.currentIndex = 0;
  }
};