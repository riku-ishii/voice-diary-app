import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import WeeklyChart from '../../components/WeeklyChart';
import { EMOTION_COLORS } from '../../constants/emotions';
import { loadWeeklyEntries } from '../../services/storage';

interface DayData {
  date: string;
  emotionLabel?: string;
  emotionScore?: number;
  emotionValence?: number;
  color?: string;
}

function buildWeekDays(entries: Awaited<ReturnType<typeof loadWeeklyEntries>>): DayData[] {
  const days: DayData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = entries.find((e) => e.date === dateStr);
    days.push({
      date: dateStr,
      emotionLabel: entry?.emotionLabel,
      emotionScore: entry?.emotionScore,
      emotionValence: entry?.emotionValence,
      color: entry ? EMOTION_COLORS[entry.emotionLabel] : undefined,
    });
  }
  return days;
}

export default function WeeklyScreen() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWeeklyEntries()
        .then((entries) => setDays(buildWeekDays(entries)))
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>今週のきもち</Text>
      {loading ? (
        <ActivityIndicator color="#7B68EE" size="large" />
      ) : (
        <WeeklyChart days={days} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 60,
    paddingHorizontal: 16,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
    textAlign: 'center',
  },
});
