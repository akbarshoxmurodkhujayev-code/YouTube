import express from 'express';
import { getVideoComments } from '../services/youtube.js';
import { withCache } from '../utils/cache.js';

const router = express.Router();

router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { pageToken = '' } = req.query;
    const cacheKey = `comments:${videoId}:${pageToken}`;
    const { data, fromCache } = await withCache(cacheKey, () =>
      getVideoComments(videoId, pageToken)
    );
    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;