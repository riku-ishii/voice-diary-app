export interface SessionMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DiarySession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  transcript?: string;
  ai_summary?: string;
  emotion_label?: string;
  emotion_score?: number;
  emotion_valence?: number;
}

export interface EmotionResult {
  label: string;
  score: number;
  valence: number;
  summary: string;
}

export interface WeeklyDay {
  date: string;
  emotionLabel?: string;
  emotionScore?: number;
  emotionValence?: number;
  color?: string;
}
