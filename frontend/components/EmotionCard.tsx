import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EMOTION_COLORS, DEFAULT_COLOR } from '../constants/emotions';

interface EmotionCardProps {
  label: string;
  score: number;
  valence: number;
  summary: string;
}

export default function EmotionCard({ label, score, summary }: EmotionCardProps) {
  const color = EMOTION_COLORS[label] ?? DEFAULT_COLOR;

  return (
    <View style={[styles.card, { borderColor: color }]}>
      <View style={[styles.labelBadge, { backgroundColor: color }]}>
        <Text style={styles.labelText}>{label}</Text>
      </View>

      <Text style={styles.summary}>{summary}</Text>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>強さ</Text>
        <View style={styles.scoreTrack}>
          <View style={[styles.scoreFill, { width: `${Math.round(score * 100)}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.scoreValue}>{Math.round(score * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  labelBadge: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  labelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  summary: {
    fontSize: 16,
    color: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  scoreLabel: {
    color: '#94A3B8',
    fontSize: 13,
    width: 28,
  },
  scoreTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    color: '#94A3B8',
    fontSize: 13,
    width: 36,
    textAlign: 'right',
  },
});
