import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeRoute } from './routes/analyze.js';
import { analyzeSecondaryRoute } from './routes/analyze-secondary.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API routes
app.use('/api', analyzeRoute);
app.use('/api', analyzeSecondaryRoute);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
