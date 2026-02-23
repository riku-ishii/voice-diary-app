import axios from 'axios';

const BASE_URL = 'http://192.168.3.2:3000';

const api = axios.create({ baseURL: BASE_URL });

export async function respondToSession(
  audioUri: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ transcript: string; aiMessage: string; isEnding: boolean }> {
  const formData = new FormData();
  formData.append('history', JSON.stringify(history));

  const response = await fetch(audioUri);
  const blob = await response.blob();
  formData.append('audio', blob, 'audio.m4a');

  const { data } = await api.post('/api/diary/respond', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function analyzeEmotion(transcript: string): Promise<{
  label: string;
  score: number;
  valence: number;
  summary: string;
}> {
  const { data } = await api.post('/api/diary/analyze', { transcript });
  return data;
}
