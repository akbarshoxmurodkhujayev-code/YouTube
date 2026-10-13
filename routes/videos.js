import express from 'express';
import {
  getVideoById,
  getVideosByIds,
  getTrendingVideos,
  getShorts
} from '../services/youtube.js';
import { withCache } from '../utils/cache.js';

const router = express.Router();

// MUHIM: /trending va /shorts /:id dan OLDIN turishi kerak

router.get('/trending', async (req, res) => {
  try {
    const { region = 'UZ', pageToken = '' } = req.query;
    const cacheKey = `trending:${region}:${pageToken}`;
    const { data, fromCache } = await withCache(cacheKey, () =>
      getTrendingVideos(region, pageToken)
    );
    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json(data);
  } catch (error) {
    console.error('Trending xatosi:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/shorts', async (req, res) => {
  try {
    const { pageToken = '' } = req.query;
    const cacheKey = `shorts:${pageToken}`;
    const { data, fromCache } = await withCache(cacheKey, () => getShorts(pageToken));
    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json(data);
  } catch (error) {
    console.error('Shorts xatosi:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/batch', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'ids kerak' });
    const idArray = ids.split(',').filter(Boolean);
    const cacheKey = `batch:${idArray.sort().join(',')}`;
    const { data } = await withCache(cacheKey, () => getVideosByIds(idArray));
    res.json({ videos: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `video:${id}`;
    const { data, fromCache } = await withCache(cacheKey, () => getVideoById(id));

    if (!data) return res.status(404).json({ error: 'Video topilmadi' });

    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;