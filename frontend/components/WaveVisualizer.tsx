import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface WaveVisualizerProps {
  isRecording: boolean;
}

const BAR_COUNT = 5;

export default function WaveVisualizer({ isRecording }: WaveVisualizerProps) {
  const anims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))).current;
  const loops = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (isRecording) {
      loops.current = anims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 80),
            Animated.timing(anim, { toValue: 1, duration: 300 + i * 60, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.2, duration: 300 + i * 60, useNativeDriver: false }),
          ])
        )
      );
      loops.current.forEach((l) => l.start());
    } else {
      loops.current.forEach((l) => l.stop());
      anims.forEach((a) => a.setValue(0.2));
    }
  }, [isRecording]);

  return (
    <View style={styles.container}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: anim.interpolate({
                inputRange: [0.2, 1],
                outputRange: [8, 40],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#7B68EE',
  },
});
