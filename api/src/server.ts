import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDb } from './db';
import { scanRouter } from './routes/scan';
import { leaderboardRouter } from './routes/leaderboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' })); // Allow large HTML payloads

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/scan', scanRouter);
app.use('/api/leaderboard', leaderboardRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Start
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🔍 Sus Score API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
