import { Router, Request, Response } from 'express';
import multer from 'multer';
import { upsertUser, createSession, addMessage, getMessages, updateSessionEnd } from '../services/supabase';
import { transcribeAudio } from '../services/whisper';
import { generateReflection, analyzeEmotion } from '../services/claude';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/diary/start
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });

    const userId = await upsertUser(deviceId);
    const sessionId = await createSession(userId);

    const aiMessage = 'こんばんは。今日はどんな一日でしたか？';
    await addMessage(sessionId, 'assistant', aiMessage);

    res.json({ sessionId, aiMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/diary/respond
router.post('/respond', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const file = req.file;
    if (!sessionId || !file) return res.status(400).json({ error: 'sessionId and audio are required' });

    const transcript = await transcribeAudio(file.buffer, file.mimetype);
    await addMessage(sessionId, 'user', transcript);

    const messages = await getMessages(sessionId);
    const history = messages.slice(0, -1); // 今追加したuserメッセージを除く

    const aiMessage = await generateReflection(
      history.map((m) => ({ role: m.role, content: m.content })),
      transcript
    );
    await addMessage(sessionId, 'assistant', aiMessage);

    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const isEnding = assistantMessages.length >= 3 && aiMessage.includes('ゆっくり休んでね');

    res.json({ transcript, aiMessage, isEnding });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/diary/end
router.post('/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const messages = await getMessages(sessionId);
    const transcript = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    const emotion = await analyzeEmotion(transcript);
    await updateSessionEnd(sessionId, { ...emotion, transcript });

    res.json({
      emotionLabel: emotion.label,
      emotionScore: emotion.score,
      emotionValence: emotion.valence,
      summary: emotion.summary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
