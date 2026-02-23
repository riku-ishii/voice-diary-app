import OpenAI from 'openai';
import { toFile } from 'openai';

// デモ用のサンプル発話リスト
const DEMO_TRANSCRIPTS = [
  '今日は仕事がすごく忙しくて、会議が3つも続いて疲れました',
  'でも夕飯においしいものを食べたのでちょっと元気出ました',
  'あとは早く寝たいです',
];
let demoIndex = 0;

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  if (process.env.DEMO_MODE === 'true') {
    const text = DEMO_TRANSCRIPTS[demoIndex % DEMO_TRANSCRIPTS.length];
    demoIndex++;
    return text;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a'
    : mimeType.includes('webm') ? 'webm'
    : mimeType.includes('ogg') ? 'ogg'
    : 'mp4';

  const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'ja',
  });

  return transcription.text;
}
