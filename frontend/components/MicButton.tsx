import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

interface MicButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function MicButton({ isRecording, onPress, disabled }: MicButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isRecording]);

  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.wrapper}>
      <Animated.View
        style={[
          styles.outerCircle,
          isRecording && styles.outerCircleRecording,
          { transform: [{ scale: pulse }] },
        ]}
      />
      <View style={[styles.button, isRecording && styles.buttonRecording]}>
        <Text style={styles.icon}>{isRecording ? '⏹' : '🎤'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  outerCircleRecording: {
    backgroundColor: 'rgba(220,50,50,0.25)',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRecording: {
    backgroundColor: '#DC2626',
  },
  icon: {
    fontSize: 28,
  },
});
