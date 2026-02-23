import OpenAI from 'openai';
import { toFile } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
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
