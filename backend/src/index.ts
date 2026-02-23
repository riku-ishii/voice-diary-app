import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import diaryRouter from './routes/diary';
import weeklyRouter from './routes/weekly';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/diary', diaryRouter);
app.use('/api', weeklyRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
