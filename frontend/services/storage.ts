import AsyncStorage from '@react-native-async-storage/async-storage';

const ENTRIES_KEY = '@voice_diary_entries';

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  transcript: string;
  emotionLabel: string;
  emotionScore: number;
  emotionValence: number;
  summary: string;
  createdAt: string;
}

export async function saveEntry(entry: Omit<DiaryEntry, 'id' | 'createdAt'>): Promise<DiaryEntry> {
  const entries = await loadEntries();
  const newEntry: DiaryEntry = {
    ...entry,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  // 同じ日付のエントリは上書き
  const filtered = entries.filter((e) => e.date !== entry.date);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify([...filtered, newEntry]));
  return newEntry;
}

export async function loadEntries(): Promise<DiaryEntry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function loadWeeklyEntries(): Promise<DiaryEntry[]> {
  const entries = await loadEntries();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return entries.filter((e) => new Date(e.date) >= sevenDaysAgo);
}
