import { create } from 'zustand';

export interface Emotion {
  label: string;
  score: number;
  valence: number;
  summary: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DiaryStore {
  messages: Message[];
  currentEmotion: Emotion | null;
  isRecording: boolean;
  addMessage: (msg: Message) => void;
  setCurrentEmotion: (e: Emotion | null) => void;
  setIsRecording: (v: boolean) => void;
  reset: () => void;
}

export const useDiaryStore = create<DiaryStore>((set) => ({
  messages: [],
  currentEmotion: null,
  isRecording: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setCurrentEmotion: (e) => set({ currentEmotion: e }),
  setIsRecording: (v) => set({ isRecording: v }),
  reset: () => set({ messages: [], currentEmotion: null, isRecording: false }),
}));
