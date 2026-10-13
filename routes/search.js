import express from 'express';
import { searchVideos, getSearchSuggestions } from '../services/youtube.js';
import { withCache } from '../utils/cache.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q, pageToken = '' } = req.query;
    if (!q) return res.status(400).json({ error: 'q parametri kerak' });

    const cacheKey = `search:${q}:${pageToken}`;
    const { data, fromCache } = await withCache(cacheKey, () => searchVideos(q, pageToken));

    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json(data);
  } catch (error) {
    console.error('Search xatosi:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const suggestions = await getSearchSuggestions(q);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;