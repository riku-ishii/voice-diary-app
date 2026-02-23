import { createClient } from '@supabase/supabase-js';
import { SessionMessage, EmotionResult, WeeklyDay } from '../types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const EMOTION_COLORS: Record<string, string> = {
  喜び: '#FFD700',
  充実: '#FF8C42',
  平和: '#87CEEB',
  疲れ: '#7B68EE',
  不安: '#9B8EA8',
  悲しみ: '#4A5568',
  怒り: '#C53030',
  空虚: '#CBD5E0',
};

export async function upsertUser(deviceId: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .upsert({ device_id: deviceId }, { onConflict: 'device_id' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function createSession(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('diary_sessions')
    .insert({ user_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('session_messages')
    .insert({ session_id: sessionId, role, content });
  if (error) throw error;
}

export async function getMessages(sessionId: string): Promise<SessionMessage[]> {
  const { data, error } = await supabase
    .from('session_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateSessionEnd(
  sessionId: string,
  data: EmotionResult & { transcript: string }
): Promise<void> {
  const { error } = await supabase
    .from('diary_sessions')
    .update({
      ended_at: new Date().toISOString(),
      transcript: data.transcript,
      ai_summary: data.summary,
      emotion_label: data.label,
      emotion_score: data.score,
      emotion_valence: data.valence,
    })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function getWeeklyData(deviceId: string): Promise<WeeklyDay[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('diary_sessions')
    .select('started_at, emotion_label, emotion_score, emotion_valence, users!inner(device_id)')
    .eq('users.device_id', deviceId)
    .gte('started_at', sevenDaysAgo.toISOString())
    .not('emotion_label', 'is', null)
    .order('started_at', { ascending: true });

  if (error) throw error;

  const days: WeeklyDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const session = (data ?? []).find((s: any) =>
      s.started_at.startsWith(dateStr)
    );

    days.push({
      date: dateStr,
      emotionLabel: session?.emotion_label ?? undefined,
      emotionScore: session?.emotion_score ?? undefined,
      emotionValence: session?.emotion_valence ?? undefined,
      color: session?.emotion_label ? EMOTION_COLORS[session.emotion_label] : undefined,
    });
  }

  return days;
}
