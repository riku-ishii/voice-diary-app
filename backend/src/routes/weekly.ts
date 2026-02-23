import { Router, Request, Response } from 'express';
import { getWeeklyData } from '../services/supabase';

const router = Router();

// GET /api/weekly-review?deviceId=xxx
router.get('/weekly-review', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.query;
    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const days = await getWeeklyData(deviceId);
    res.json({ days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
