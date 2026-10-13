const YouTubeAPI = {
  async request(endpoint, params = {}) {
    const url = new URL(`${CONFIG.API_BASE}${endpoint}`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Server xatosi: ${response.status}`);
    }
    return response.json();
  },

  async getTrending(pageToken = '') {
    const data = await this.request('/videos/trending', {
      region: CONFIG.DEFAULT_REGION,
      pageToken
    });
    return {
      videos: data.videos || [],
      nextPageToken: data.nextPageToken || ''
    };
  },

  async searchVideos(query, pageToken = '') {
    const data = await this.request('/search', { q: query, pageToken });
    return {
      videos: data.videos || [],
      nextPageToken: data.nextPageToken || ''
    };
  },

  async getVideoById(id) {
    return this.request(`/videos/${id}`);
  },

  async getShorts(pageToken = '') {
    const data = await this.request('/videos/shorts', { pageToken });
    return data.videos || [];
  },

  /**
   * Kanallar ma'lumotlarini batch orqali olish (avatarlar uchun)
   */
  async getChannelsByIds(ids) {
  if (!ids || !ids.length) return [];
  const data = await this.request('/channels/batch', { ids: ids.join(',') });
  return data.channels || [];
},

  async fetchVideos(query, pageToken = '') {
    if (query === 'trending' || query === 'home') return this.getTrending(pageToken);
    if (query === 'shorts') return this.getShorts(pageToken);
    return this.searchVideos(query, pageToken);
  }
};