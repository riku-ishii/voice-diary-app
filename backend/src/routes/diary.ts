import { Router, Request, Response } from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/whisper';
import { generateReflection, analyzeEmotion } from '../services/claude';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/diary/respond
// stateless: クライアントが会話履歴を毎回送る
router.post('/respond', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { history } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'audio is required' });

    const transcript = await transcribeAudio(file.buffer, file.mimetype);

    const parsedHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
      history ? JSON.parse(history) : [];

    const aiMessage = await generateReflection(parsedHistory, transcript);

    const allAssistantCount = parsedHistory.filter((m) => m.role === 'assistant').length;
    const isEnding = allAssistantCount >= 2 && aiMessage.includes('ゆっくり休んでね');

    res.json({ transcript, aiMessage, isEnding });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/diary/analyze
// セッション終了時に感情分析のみ行う
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'transcript is required' });

    const emotion = await analyzeEmotion(transcript);
    res.json(emotion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
