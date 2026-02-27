import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import diaryRouter from './routes/diary';
import weeklyRouter from './routes/weekly';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // モバイルアプリからのリクエスト(originなし)または許可リストに含まれる場合
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

// リクエストタイムアウト（音声処理用に30秒）
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// ヘルスチェック
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// ルート
app.use('/api/diary', diaryRouter);
app.use('/api', weeklyRouter);

// グローバルエラーハンドリング
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// グレースフルシャットダウン
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  // 10秒待っても閉じなければ強制終了
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
