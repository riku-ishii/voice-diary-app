import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DEFAULT_COLOR } from '../constants/emotions';

interface DayData {
  date: string;
  emotionLabel?: string;
  emotionScore?: number;
  emotionValence?: number;
  color?: string;
}

interface WeeklyChartProps {
  days: DayData[];
}

const BAR_MAX_HEIGHT = 48;
const BAR_MIN_HEIGHT = 6;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function WeeklyChart({ days }: WeeklyChartProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {days.map((day) => {
        const hasData = !!day.emotionLabel;
        const color = hasData ? (day.color ?? DEFAULT_COLOR) : '#334155';
        const opacity = hasData ? 0.5 + (((day.emotionValence ?? 0) + 1) / 2) * 0.5 : 0.4;

        // Bar height based on emotionScore (0-10 range)
        const score = day.emotionScore ?? 0;
        const barHeight = hasData
          ? BAR_MIN_HEIGHT + (score / 10) * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT)
          : BAR_MIN_HEIGHT;

        return (
          <View key={day.date} style={styles.dayColumn}>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: color,
                    opacity: hasData ? 0.7 : 0.2,
                  },
                ]}
              />
            </View>
            <View style={[styles.circle, { backgroundColor: color, opacity }]} />
            <Text style={styles.date}>{formatDate(day.date)}</Text>
            <Text style={styles.label} numberOfLines={1}>
              {day.emotionLabel ?? '—'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
    width: 52,
  },
  barContainer: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  date: {
    color: '#94A3B8',
    fontSize: 11,
  },
  label: {
    color: '#CBD5E0',
    fontSize: 10,
    textAlign: 'center',
  },
});
