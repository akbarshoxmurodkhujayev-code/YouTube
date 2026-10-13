import express from 'express';
import {
  getChannelById,
  getChannelVideos,
  getChannelsByIds
} from '../services/youtube.js';
import { withCache } from '../utils/cache.js';

const router = express.Router();

// ⚠️ BATCH — ENG OLDINDA
router.get('/batch', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'ids kerak' });
    const idArray = ids.split(',').filter(Boolean);
    if (!idArray.length) return res.json({ channels: [] });

    const cacheKey = `channels-batch:${idArray.sort().join(',')}`;
    const { data } = await withCache(cacheKey, () => getChannelsByIds(idArray));
    res.json({ channels: data });
  } catch (error) {
    console.error('Channels batch xatosi:', error);
    res.status(500).json({ error: error.message });
  }
});

// KEYIN /:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `channel:${id}`;
    const { data } = await withCache(cacheKey, () => getChannelById(id));
    if (!data) return res.status(404).json({ error: 'Kanal topilmadi' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const { pageToken = '' } = req.query;
    const cacheKey = `channel-videos:${id}:${pageToken}`;
    const { data } = await withCache(cacheKey, () => getChannelVideos(id, pageToken));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;