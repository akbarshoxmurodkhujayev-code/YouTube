const VideoPage = {
  async render(videoId) {
    UI.showLoading();

    try {
      const video = await YouTubeAPI.getVideoById(videoId);
      if (!video) {
        UI.showError('Video topilmadi');
        return;
      }

      let suggested = [];
      try {
        const result = await YouTubeAPI.searchVideos(video.snippet.channelTitle);
        suggested = (result.videos || []).filter(v => v.id !== videoId).slice(0, 12);
      } catch (e) {
        console.warn('Tavsiyalar olinmadi:', e);
      }

      this.renderUI(video, suggested);
    } catch (error) {
      console.error(error);
      UI.showError(error.message);
    }
  },

  renderUI(video, suggested) {
    if (!Array.isArray(suggested)) suggested = [];

    const content = document.getElementById('content');
    const title = video.snippet.title;
    const channelName = video.snippet.channelTitle;
    const channelId = video.snippet.channelId;
    const description = video.snippet.description || '';
    const publishedAt = UI.formatDate(video.snippet.publishedAt);
    const views = UI.formatViews(parseInt(video.statistics?.viewCount || 0));
    const likes = UI.formatViews(parseInt(video.statistics?.likeCount || 0));
    const avatarLetter = channelName.charAt(0).toUpperCase();

    Storage.addToHistory(video);

    const isLiked = Storage.isLiked(video.id);
    const isDisliked = Storage.isDisliked(video.id);
    const isSubscribed = Storage.isSubscribed(channelId);
    const isInWatchLater = Storage.isInWatchLater(video.id);

    content.innerHTML = `
      <div class="video-page">
        <div class="video-page__main">
          <button class="back-btn" id="backBtn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z"/>
            </svg>
            Orqaga
          </button>

          <div class="video-player">
            <iframe src="https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          </div>

          <h1 class="video-page__title">${UI.escapeHtml(title)}</h1>

          <div class="video-page__meta">
            <div class="video-page__channel">
              <div class="video-page__channel-avatar">${avatarLetter}</div>
              <div class="video-page__channel-info">
                <div class="video-page__channel-name">${UI.escapeHtml(channelName)}</div>
                <div class="video-page__subs">${isSubscribed ? 'Obuna bo\'lgansiz' : 'Obuna bo\'ling'}</div>
              </div>
            </div>

            <div class="video-page__actions">
              <!-- OBUNA -->
              <button class="action-btn action-btn--subscribe ${isSubscribed ? 'subscribed' : ''}" id="subBtn">
                ${isSubscribed ? `
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
                  </svg>
                  Obuna bo'ldingiz
                ` : `
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Obuna
                `}
              </button>

              <!-- LIKE + DISLIKE guruh -->
              <div class="action-btn-group">
                <button class="action-btn action-btn--like ${isLiked ? 'liked' : ''}" id="likeBtn">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1L14.3 1 7.6 7.6c-.4.3-.6.8-.6 1.4v10c0 1.1.9 2 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7c.1-.2.2-.5.2-.8v-2z"/>
                  </svg>
                  <span>${likes}</span>
                </button>
                <button class="action-btn action-btn--dislike ${isDisliked ? 'disliked' : ''}" id="dislikeBtn">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M15 3H6c-.8 0-1.5.5-1.8 1.2l-3 7c-.1.2-.2.5-.2.8v2c0 1.1.9 2 2 2h6.3l-1 4.6v.3c0 .4.2.8.4 1l1.1 1 6.7-6.6c.4-.3.6-.8.6-1.4V5c0-1.1-.9-2-2-2zm5 0v12h4V3h-4z"/>
                  </svg>
                </button>
              </div>

              <!-- ULASHISH -->
              <button class="action-btn" id="shareBtn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.1c.1-.3.1-.5.1-.8s0-.5-.1-.8l7-4.1c.6.5 1.3.8 2.1.8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .3 0 .5.1.8L8.1 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2.1-.8l7.1 4.1c-.1.3-.1.5-.1.8 0 1.6 1.3 3 3 3s3-1.3 3-3-1.4-3-3-3z"/>
                </svg>
                Ulashish
              </button>

              <!-- KEYINROQ -->
              <button class="action-btn" id="watchLaterBtn">
                ${isInWatchLater ? `
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
                  </svg>
                  Saqlandi
                ` : `
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 7 7 7 7 0 0 1-6-3.5l-1.5 1.5A9 9 0 1 0 13 3zm-1 5v5l4 2.5.8-1.3-3.3-2V8H12z"/>
                  </svg>
                  Keyinroq
                `}
              </button>
            </div>
          </div>

          <div class="video-description" id="descBox">
            <div class="video-description__stats">${views} ko'rishlar · ${publishedAt}</div>
            <div class="video-description__text collapsed" id="descText">${UI.escapeHtml(description || 'Tavsif yo\'q')}</div>
            <div class="video-description__toggle" id="descToggle">Ko'proq ko'rsatish</div>
          </div>
        </div>

        <div class="video-page__sidebar">
          <h3 style="margin-bottom: 12px; font-size: 15px;">Tavsiyalar</h3>
          <div id="suggestedList"></div>
        </div>
      </div>
    `;

    // Obuna
    document.getElementById('subBtn').onclick = (e) => {
      const btn = e.currentTarget;
      const nowSubscribed = Storage.toggleSubscription(channelId);
      btn.classList.toggle('subscribed', nowSubscribed);
      btn.innerHTML = nowSubscribed
        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg> Obuna bo'ldingiz`
        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Obuna`;
    };

    // Like
    document.getElementById('likeBtn').onclick = (e) => {
      const btn = e.currentTarget;
      const nowLiked = Storage.toggleLike(video.id);
      btn.classList.toggle('liked', nowLiked);

      const dislikeBtn = document.getElementById('dislikeBtn');
      if (nowLiked) dislikeBtn.classList.remove('disliked');
    };

    // Dislike
    document.getElementById('dislikeBtn').onclick = (e) => {
      const btn = e.currentTarget;
      const nowDisliked = Storage.toggleDislike(video.id);
      btn.classList.toggle('disliked', nowDisliked);

      const likeBtn = document.getElementById('likeBtn');
      if (nowDisliked) likeBtn.classList.remove('liked');
    };

    // Keyinroq
    document.getElementById('watchLaterBtn').onclick = (e) => {
      const btn = e.currentTarget;
      const added = Storage.toggleWatchLater(video);
      btn.innerHTML = added
        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg> Saqlandi`
        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 7 7 7 7 0 0 1-6-3.5l-1.5 1.5A9 9 0 1 0 13 3zm-1 5v5l4 2.5.8-1.3-3.3-2V8H12z"/></svg> Keyinroq`;
    };

    // Ulashish
    document.getElementById('shareBtn').onclick = () => {
      const url = `https://youtube.com/watch?v=${video.id}`;
      if (navigator.share) {
        navigator.share({ title, url }).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        alert('Havola nusxalandi!');
      }
    };

    // Tavsif
    document.getElementById('descToggle').onclick = () => {
      const text = document.getElementById('descText');
      const toggle = document.getElementById('descToggle');
      text.classList.toggle('collapsed');
      toggle.textContent = text.classList.contains('collapsed') ? "Ko'proq ko'rsatish" : "Kamroq ko'rsatish";
    };

    // Orqaga
    document.getElementById('backBtn').onclick = () => Router.navigate('/');

    // Tavsiyalar
    const list = document.getElementById('suggestedList');
    suggested.forEach(v => {
      if (!v.snippet || !v.id) return;
      const item = document.createElement('div');
      item.className = 'suggested-video';
      const thumb = v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url;
      const dur = UI.formatDuration(v.contentDetails?.duration || '');
      item.innerHTML = `
        <div class="suggested-video__thumb">
          <img src="${thumb}" alt="">
          ${dur ? `<span class="suggested-video__duration">${dur}</span>` : ''}
        </div>
        <div class="suggested-video__info">
          <div class="suggested-video__title">${UI.escapeHtml(v.snippet.title)}</div>
          <div class="suggested-video__channel">${UI.escapeHtml(v.snippet.channelTitle)}</div>
        </div>
      `;
      item.onclick = () => Router.navigate(`/watch/${v.id}`);
      list.appendChild(item);
    });
  }
};