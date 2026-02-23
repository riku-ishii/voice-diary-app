import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { loadEntries } from '../../services/storage';

const DEVICE_ID_KEY = '@voice_diary_device_id';

function generateDeviceId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function HomeScreen() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [alreadyWroteToday, setAlreadyWroteToday] = useState(false);

  useEffect(() => {
    (async () => {
      let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = generateDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, id);
      }
      setDeviceId(id);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const entries = await loadEntries();
        const today = new Date().toISOString().split('T')[0];
        setAlreadyWroteToday(entries.some((e) => e.date === today));
      })();
    }, [])
  );

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🌙</Text>
        <Text style={styles.title}>おやすみ前の1分</Text>
        <Text style={styles.subtitle}>今日の気持ちを声で話してみよう</Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            alreadyWroteToday && styles.buttonDone,
          ]}
          onPress={() => router.push('/recording')}
          disabled={!deviceId}
        >
          <Text style={[styles.buttonText, alreadyWroteToday && styles.buttonTextDone]}>
            {alreadyWroteToday ? '今日はもう話したね 🌙' : '話しはじめる'}
          </Text>
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
    gap: 16,
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#7B68EE',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDone: {
    backgroundColor: 'rgba(123,104,238,0.3)',
    opacity: 0.6,
  },
  buttonTextDone: {
    opacity: 0.7,
  },
});
