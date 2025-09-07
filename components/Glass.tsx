import React from 'react';
import { Platform, View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

interface GlassProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  border?: boolean;
  radius?: number;
}

export default function Glass({
  style,
  children,
  intensity = 25,
  tint = 'dark',
  border = true,
  radius = 16,
  ...rest
}: GlassProps) {
  const commonStyle = [
    styles.container,
    { borderRadius: radius, borderColor: border ? colors.glassBorder : 'transparent' },
    style,
  ];

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint={tint} style={commonStyle} {...rest}>
        <View style={styles.backdrop} />
        {children}
      </BlurView>
    );
  }

  // Fallback glass effect using semi-transparent background
  return (
    <View style={[commonStyle, { backgroundColor: colors.glassBackground }]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBackground,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
