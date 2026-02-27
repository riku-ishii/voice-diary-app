import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const ONBOARDING_KEY = '@onboarding_completed';
const { width } = Dimensions.get('window');

const steps = [
  {
    emoji: '🗣️',
    title: '声で話すだけ',
    description: '1分で今日の気持ちを整理できる。\nタイピング不要、話すだけでOK。',
  },
  {
    emoji: '🤖',
    title: 'AIが聞いてくれる',
    description: '共感して返してくれるから、\nひとりじゃない安心感。',
  },
  {
    emoji: '📊',
    title: '心のリズムを振り返る',
    description: '週末には1週間の気持ちの流れが見える。\nマイクへのアクセスを許可してね。',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const step = steps[currentStep];

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{step.emoji}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {isLastStep ? 'はじめる' : '次へ'}
          </Text>
        </Pressable>

        {!isLastStep && (
          <Pressable
            onPress={async () => {
              await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
              router.replace('/(tabs)');
            }}
          >
            <Text style={styles.skipText}>スキップ</Text>
          </Pressable>
        )}
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
    paddingHorizontal: 40,
    gap: 16,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 60,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(123,104,238,0.3)',
  },
  dotActive: {
    backgroundColor: '#7B68EE',
    width: 24,
  },
  button: {
    backgroundColor: '#7B68EE',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    minWidth: width * 0.6,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
  },
  skipText: {
    color: '#475569',
    fontSize: 14,
  },
});
