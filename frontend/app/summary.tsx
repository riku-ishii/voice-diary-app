import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import EmotionCard from '../components/EmotionCard';
import { useDiaryStore } from '../stores/diaryStore';

export default function SummaryScreen() {
  const router = useRouter();
  const { currentEmotion, reset } = useDiaryStore();

  function handleHome() {
    reset();
    router.replace('/');
  }

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>今日のきもち</Text>

        {currentEmotion ? (
          <EmotionCard
            label={currentEmotion.label}
            score={currentEmotion.score}
            valence={currentEmotion.valence}
            summary={currentEmotion.summary}
          />
        ) : (
          <Text style={styles.noData}>データがありません</Text>
        )}

        <Text style={styles.message}>また明日も話しかけてね 🌙</Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleHome}
        >
          <Text style={styles.buttonText}>ホームに戻る</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  noData: {
    color: '#94A3B8',
    fontSize: 16,
  },
  message: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#7B68EE',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
});
