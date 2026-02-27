import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ConversationBubble from '../components/ConversationBubble';
import MicButton from '../components/MicButton';
import WaveVisualizer from '../components/WaveVisualizer';
import { analyzeEmotion, respondToSession } from '../services/api';
import { saveEntry } from '../services/storage';
import { useDiaryStore } from '../stores/diaryStore';

const INITIAL_AI_MESSAGE = 'こんばんは。今日はどんな一日でしたか？';

export default function RecordingScreen() {
  const router = useRouter();
  const { messages, isRecording, addMessage, setIsRecording, setCurrentEmotion, reset } = useDiaryStore();
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    reset();
    addMessage({ role: 'assistant', content: INITIAL_AI_MESSAGE });
    (async () => {
      const result = await Audio.requestPermissionsAsync();
      if (result.granted) {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        speak(INITIAL_AI_MESSAGE);
      } else {
        setPermissionDenied(true);
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // 画面を離れるときに読み上げを止める
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  function speak(text: string) {
    if (muted) return;
    Speech.stop();
    Speech.speak(text, { language: 'ja-JP', rate: 0.9 });
  }

  async function finishSession(transcripts: string[]) {
    const transcript = transcripts.join('\n');
    const emotion = await analyzeEmotion(transcript);
    const today = new Date().toISOString().split('T')[0];
    await saveEntry({
      date: today,
      transcript,
      emotionLabel: emotion.label,
      emotionScore: emotion.score,
      emotionValence: emotion.valence,
      summary: emotion.summary,
    });
    setCurrentEmotion(emotion);
    router.push('/summary');
  }

  async function handleMicPress() {
    if (isRecording) {
      try {
        setIsRecording(false);
        setLoading(true);
        await recordingRef.current?.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        const uri = recordingRef.current?.getURI();
        recordingRef.current = null;
        if (!uri) return;

        const { transcript, aiMessage, isEnding } = await respondToSession(uri, messages);
        addMessage({ role: 'user', content: transcript });
        addMessage({ role: 'assistant', content: aiMessage });
        speak(aiMessage);

        if (isEnding) {
          const userTexts = messages
            .filter((m) => m.role === 'user')
            .map((m) => m.content)
            .concat(transcript);
          await finishSession(userTexts);
        }
      } catch (e) {
        console.error(e);
        setErrorMessage('通信エラーが発生しました。もう一度お試しください');
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        Speech.stop(); // 録音開始時に読み上げを停止
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  }

  async function handleEndSession() {
    if (loading) return;
    try {
      setLoading(true);
      Speech.stop();
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
        setIsRecording(false);
      }
      const userTexts = messages.filter((m) => m.role === 'user').map((m) => m.content);
      if (userTexts.length === 0) {
        router.back();
        return;
      }
      await finishSession(userTexts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleMute() {
    if (!muted) Speech.stop();
    setMuted((prev) => !prev);
  }

  return (
    <View style={styles.container}>
      {permissionDenied && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionText}>
            マイクのアクセスを許可してください。設定アプリ → プライバシー → マイク から変更できます
          </Text>
        </View>
      )}

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
        {messages.map((msg, i) => (
          <ConversationBubble key={i} role={msg.role} content={msg.content} />
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <WaveVisualizer isRecording={isRecording} />
        <MicButton isRecording={isRecording} onPress={handleMicPress} disabled={loading || permissionDenied} />
        {loading && <ActivityIndicator color="#7B68EE" style={styles.spinner} />}
      </View>

      {!loading && messages.some((m) => m.role === 'user') && (
        <Pressable onPress={handleEndSession} style={styles.endButton}>
          <Text style={styles.endButtonText}>話し終えた</Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← 戻る</Text>
      </Pressable>

      <Pressable onPress={handleToggleMute} style={styles.muteButton}>
        <Text style={styles.muteText}>{muted ? '🔇' : '🔊'}</Text>
      </Pressable>

      {errorMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 60,
    paddingBottom: 16,
    gap: 4,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  spinner: {
    position: 'absolute',
    bottom: 24,
    right: 32,
  },
  endButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(123,104,238,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(123,104,238,0.3)',
    marginBottom: 8,
  },
  endButtonText: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
  },
  backText: {
    color: '#94A3B8',
    fontSize: 15,
  },
  muteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  muteText: {
    fontSize: 20,
  },
  permissionBanner: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 16,
    zIndex: 10,
  },
  permissionText: {
    color: '#FCA5A5',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
