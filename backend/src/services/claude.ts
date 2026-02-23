import Anthropic from '@anthropic-ai/sdk';
import { EmotionResult } from '../types';

const REFLECTION_SYSTEM = `あなたは毎晩ユーザーの話を聞いてくれる、優しい日記の相棒です。
ユーザーが今日あったことや気持ちを話してくれます。

ルール:
- 100文字以内で返答する
- ユーザーの言葉をそのまま使って反射する（リフレクト）
- 「それは大変だったね」「そんな日もあるよね」など共感を示す
- 絶対にアドバイスや解決策を出さない
- 質問は1つまで。深掘りしすぎない
- 最後の返答では「今日も話してくれてありがとう。ゆっくり休んでね」で締める`;

// デモモード用のモックレスポンス
const DEMO_REFLECTIONS = [
  'そうか、今日もいろいろあったんだね。もう少し聞かせてもらえる？',
  'それは大変だったね。疲れが声に出てたよ。',
  '今日も話してくれてありがとう。ゆっくり休んでね🌙',
];
let demoReflectionIndex = 0;

const DEMO_EMOTIONS: EmotionResult[] = [
  { label: '疲れ', score: 0.7, valence: -0.3, summary: '今日もお疲れさまでした' },
  { label: '平和', score: 0.6, valence: 0.3, summary: '穏やかな一日でした' },
  { label: '充実', score: 0.8, valence: 0.6, summary: '充実した一日でした' },
];

export async function generateReflection(
  messages: Array<{ role: string; content: string }>,
  newTranscript: string
): Promise<string> {
  if (process.env.DEMO_MODE === 'true') {
    const reply = DEMO_REFLECTIONS[demoReflectionIndex % DEMO_REFLECTIONS.length];
    demoReflectionIndex++;
    return reply;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const history = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  history.push({ role: 'user', content: newTranscript });

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: REFLECTION_SYSTEM,
    messages: history,
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function analyzeEmotion(transcript: string): Promise<EmotionResult> {
  if (process.env.DEMO_MODE === 'true') {
    return DEMO_EMOTIONS[Math.floor(Math.random() * DEMO_EMOTIONS.length)];
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = `以下のユーザーの発話から感情を分析してください。JSON形式のみで返答してください。

発話内容: ${transcript}

返答形式:
{
  "label": "疲れ|悲しみ|不安|怒り|喜び|平和|充実|空虚",
  "score": 0.0〜1.0,
  "valence": -1.0〜1.0,
  "summary": "今日の気持ちを一言で（20文字以内）"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  const text = block.type === 'text' ? block.text : '{}';

  try {
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    return json as EmotionResult;
  } catch {
    return { label: '空虚', score: 0.5, valence: 0, summary: '気持ちを整理中' };
  }
}
