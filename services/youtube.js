const API_BASE = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(endpoint, params) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `YouTube API xatosi: ${response.status}`);
  }
  return response.json();
}

export async function searchVideos(query, pageToken = '', maxResults = 24) {
  const searchData = await ytFetch('search', {
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults,
    pageToken
  });

  if (!searchData.items?.length) {
    return { videos: [], nextPageToken: '', totalResults: 0 };
  }

  const videoIds = searchData.items.map(item => item.id?.videoId).filter(Boolean);
  const detailsData = await ytFetch('videos', {
    part: 'contentDetails,statistics,snippet',
    id: videoIds.join(',')
  });

  const videoMap = new Map(detailsData.items.map(v => [v.id, v]));
  const videos = videoIds.map(id => videoMap.get(id)).filter(Boolean);

  return {
    videos,
    nextPageToken: searchData.nextPageToken || '',
    totalResults: searchData.pageInfo?.totalResults || 0
  };
}

export async function getVideoById(videoId) {
  const data = await ytFetch('videos', {
    part: 'contentDetails,statistics,snippet',
    id: videoId
  });
  return data.items?.[0] || null;
}

export async function getVideosByIds(videoIds) {
  if (!videoIds.length) return [];
  const data = await ytFetch('videos', {
    part: 'contentDetails,statistics,snippet',
    id: videoIds.join(',')
  });
  return data.items || [];
}

export async function getChannelById(channelId) {
  const data = await ytFetch('channels', {
    part: 'snippet,statistics,brandingSettings',
    id: channelId
  });
  return data.items?.[0] || null;
}

/**
 * Bir nechta kanalni ID orqali olish (avatarlar uchun)
 */
export async function getChannelsByIds(channelIds) {
  if (!channelIds.length) return [];
  const data = await ytFetch('channels', {
    part: 'snippet,statistics',
    id: channelIds.join(',')
  });
  return data.items || [];
}

export async function getChannelVideos(channelId, pageToken = '', maxResults = 24) {
  const searchData = await ytFetch('search', {
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults,
    pageToken
  });

  if (!searchData.items?.length) {
    return { videos: [], nextPageToken: '' };
  }

  const videoIds = searchData.items.map(i => i.id?.videoId).filter(Boolean);
  const videos = await getVideosByIds(videoIds);

  return {
    videos,
    nextPageToken: searchData.nextPageToken || ''
  };
}

export async function getVideoComments(videoId, pageToken = '', maxResults = 20) {
  const data = await ytFetch('commentThreads', {
    part: 'snippet,replies',
    videoId,
    maxResults,
    order: 'relevance',
    pageToken
  });

  return {
    comments: data.items || [],
    nextPageToken: data.nextPageToken || '',
    totalResults: data.pageInfo?.totalResults || 0
  };
}

export async function getTrendingVideos(regionCode = 'US', pageToken = '', maxResults = 24) {
  const data = await ytFetch('videos', {
    part: 'contentDetails,statistics,snippet',
    chart: 'mostPopular',
    regionCode,
    maxResults,
    pageToken
  });

  return {
    videos: data.items || [],
    nextPageToken: data.nextPageToken || ''
  };
}

export async function getShorts(pageToken = '', maxResults = 50) {
  const queries = ['shorts', '#shorts', 'viral', 'trending'];

  for (const query of queries) {
    try {
      console.log(`🔍 Shorts qidiruv: "${query}"`);

      const searchData = await ytFetch('search', {
        part: 'snippet',
        q: query,
        type: 'video',
        videoDuration: 'short',
        maxResults,
        pageToken,
        regionCode: 'US',
        relevanceLanguage: 'en'
      });

      if (!searchData.items?.length) {
        console.log(`⚠️ "${query}" bo'yicha natija yo'q`);
        continue;
      }

      const videoIds = searchData.items.map(i => i.id?.videoId).filter(Boolean);
      if (!videoIds.length) continue;

      const videos = await getVideosByIds(videoIds);

      const shorts = videos.filter(v => {
        const duration = v.contentDetails?.duration || '';
        const secs = parseDuration(duration);
        return secs > 0 && secs <= 180;
      });

      if (shorts.length > 0) {
        console.log(`✅ "${query}" bo'yicha ${shorts.length} ta shorts topildi`);
        return {
          videos: shorts,
          nextPageToken: searchData.nextPageToken || ''
        };
      } else {
        console.log(`⚠️ "${query}": ${videos.length} ta video olindi, lekin filtrdan o'tmadi`);
      }
    } catch (err) {
      console.warn(`⚠️ "${query}" xatosi:`, err.message);
    }
  }

  console.log('❌ Barcha urinishlar muvaffaqiyatsiz');
  return { videos: [], nextPageToken: '' };
}

function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 3600) +
         (parseInt(match[2] || 0) * 60) +
         parseInt(match[3] || 0);
}

export async function getSearchSuggestions(query) {
  const url = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const text = await response.text();
  const jsonMatch = text.match(/\[.*\]/);
  if (!jsonMatch) return [];
  try {
    const data = JSON.parse(jsonMatch[0]);
    return (data[1] || []).map(item => item[0]);
  } catch {
    return [];
  }
}