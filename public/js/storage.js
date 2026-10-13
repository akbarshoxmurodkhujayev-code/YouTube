/**
 * localStorage bilan ishlash
 * Like, obuna, tarix, keyinroq ko'rish uchun
 */
const Storage = {
  KEYS: {
    LIKES: 'ytc_likes',
    DISLIKES: 'ytc_dislikes',
    SUBSCRIPTIONS: 'ytc_subs',
    HISTORY: 'ytc_history',
    WATCH_LATER: 'ytc_watch_later'
  },

  // ============ LIKE ============
  getLikes() {
    return JSON.parse(localStorage.getItem(this.KEYS.LIKES) || '[]');
  },
  isLiked(videoId) {
    return this.getLikes().includes(videoId);
  },
  toggleLike(videoId) {
    const likes = this.getLikes();
    const idx = likes.indexOf(videoId);
    if (idx >= 0) {
      likes.splice(idx, 1);
      this.removeDislike(videoId);
      this.save(this.KEYS.LIKES, likes);
      return false;
    } else {
      likes.push(videoId);
      this.save(this.KEYS.LIKES, likes);
      this.removeDislike(videoId);
      return true;
    }
  },

  // ============ DISLIKE ============
  getDislikes() {
    return JSON.parse(localStorage.getItem(this.KEYS.DISLIKES) || '[]');
  },
  isDisliked(videoId) {
    return this.getDislikes().includes(videoId);
  },
  toggleDislike(videoId) {
    const dis = this.getDislikes();
    const idx = dis.indexOf(videoId);
    if (idx >= 0) {
      dis.splice(idx, 1);
      this.save(this.KEYS.DISLIKES, dis);
      return false;
    } else {
      dis.push(videoId);
      this.save(this.KEYS.DISLIKES, dis);
      this.removeLike(videoId);
      return true;
    }
  },
  removeLike(videoId) {
    const likes = this.getLikes().filter(id => id !== videoId);
    this.save(this.KEYS.LIKES, likes);
  },
  removeDislike(videoId) {
    const dis = this.getDislikes().filter(id => id !== videoId);
    this.save(this.KEYS.DISLIKES, dis);
  },

  // ============ OBUNA ============
  getSubscriptions() {
    return JSON.parse(localStorage.getItem(this.KEYS.SUBSCRIPTIONS) || '[]');
  },
  isSubscribed(channelId) {
    return this.getSubscriptions().includes(channelId);
  },
  toggleSubscription(channelId) {
    const subs = this.getSubscriptions();
    const idx = subs.indexOf(channelId);
    if (idx >= 0) {
      subs.splice(idx, 1);
      this.save(this.KEYS.SUBSCRIPTIONS, subs);
      return false;
    } else {
      subs.push(channelId);
      this.save(this.KEYS.SUBSCRIPTIONS, subs);
      return true;
    }
  },

  // ============ TARIX ============
  getHistory() {
    return JSON.parse(localStorage.getItem(this.KEYS.HISTORY) || '[]');
  },
  addToHistory(video) {
    if (!video || !video.id) return;
    const history = this.getHistory().filter(v => v.id !== video.id);
    history.unshift({
      id: video.id,
      title: video.snippet?.title,
      thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
      channelTitle: video.snippet?.channelTitle,
      watchedAt: Date.now()
    });
    // Maksimum 100 ta saqlash
    this.save(this.KEYS.HISTORY, history.slice(0, 100));
  },
  clearHistory() {
    this.save(this.KEYS.HISTORY, []);
  },

  // ============ KEYINROQ KO'RISH ============
  getWatchLater() {
    return JSON.parse(localStorage.getItem(this.KEYS.WATCH_LATER) || '[]');
  },
  isInWatchLater(videoId) {
    return this.getWatchLater().some(v => v.id === videoId);
  },
  toggleWatchLater(video) {
    const list = this.getWatchLater();
    const idx = list.findIndex(v => v.id === video.id);
    if (idx >= 0) {
      list.splice(idx, 1);
      this.save(this.KEYS.WATCH_LATER, list);
      return false;
    } else {
      list.push({
        id: video.id,
        title: video.snippet?.title,
        thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
        channelTitle: video.snippet?.channelTitle
      });
      this.save(this.KEYS.WATCH_LATER, list);
      return true;
    }
  },

  // ============ YORDAMCHI ============
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage saqlashda xatolik:', e);
    }
  },

  clear() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  }
};