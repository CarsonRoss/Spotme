import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';

type Props = {
  text: string;
  delay?: number;     // ms between letters
  duration?: number;  // s per letter (kept for API compatibility but spring is used)
};

export default function SplitTextRN({ text, delay = 60, duration = 0.35 }: Props) {
  const letters = [...text];
  const anims = useRef(letters.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const seq = letters.map((_, i) =>
      Animated.spring(anims[i], {
        toValue: 1,
        speed: 16,
        bounciness: 8,
        useNativeDriver: true,
      })
    );
    Animated.stagger(delay, seq).start();
  }, [anims, letters, delay]);

  return (
    <View style={styles.row} accessibilityRole="text">
      {letters.map((ch, i) => (
        <Animated.Text
          key={`${ch}-${i}`}
          style={[
            styles.letter,
            {
              opacity: anims[i],
              transform: [
                {
                  translateY: anims[i].interpolate({
                    inputRange: [0, 0.9, 1],
                    outputRange: [24, -3, 0], // small bounce overshoot
                  }),
                },
                {
                  scale: anims[i].interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.95, 1.03, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {ch}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  letter: { color: '#fff', fontSize: 22, fontWeight: '800' },
});