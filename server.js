import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import searchRoutes from './routes/search.js';
import videoRoutes from './routes/videos.js';
import channelRoutes from './routes/channels.js';
import commentRoutes from './routes/comments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(compression());
app.use(express.json());

if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY.startsWith('BU_YERGA')) {
  console.error('❌ XATOLIK: .env faylida YOUTUBE_API_KEY o\'rnatilmagan!');
  process.exit(1);
}
app.use('/api/search', searchRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/comments', commentRoutes);

app.get('/api/debug/cache', async (req, res) => {
  const { getCacheStats } = await import('./utils/cache.js');
  res.json(getCacheStats());
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ================================');
  console.log(`🚀  Server ishga tushdi!`);
  console.log(`🚀  http://localhost:${PORT}`);
  console.log('🚀 ================================');
  console.log('');
});