import React, { useEffect, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Path, Circle, Defs, Pattern, Rect, G } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function InPhoneRouteAnimation() {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // Zig-zag path sized for the mock screen
  const pathData = 'M 50 300 L 150 250 L 100 180 L 200 130 L 150 60 L 250 50';

  // Parse points from the path string (supports simple M/L pairs)
  const points = useMemo(() => {
    const nums = pathData
      .replace(/[ML]/g, '')
      .trim()
      .split(/\s+/)
      .map((n) => parseFloat(n));
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < nums.length; i += 2) {
      pts.push({ x: nums[i], y: nums[i + 1] });
    }
    return pts;
  }, [pathData]);

  // Compute polyline total length
  const PATH_LENGTH = useMemo(() => {
    if (points.length < 2) return 400;
    let len = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      len += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return Math.ceil(len + 10);
  }, [points]);

  const startPoint = points[0] ?? { x: 50, y: 300 };
  const endPoint = points[points.length - 1] ?? { x: 250, y: 50 };

  useEffect(() => {
    // One-shot draw; parent controls remount/loop cadence
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Start pulsing
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [progress, pulse]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [PATH_LENGTH, 0],
  });
  const endOpacity = progress.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0.3, 0.3, 1] });

  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 350">
      <Defs>
        <Pattern id="grid" patternUnits="userSpaceOnUse" width="20" height="20">
          <Path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2a2b2e" strokeWidth="0.5" opacity="0.25" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grid)" />

      {/* Animated route */}
      <AnimatedPath
        d={pathData}
        fill="none"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
        strokeDashoffset={dashOffset as unknown as number}
      />

      {/* Start point (pulse) */}
      <AnimatedG
        style={{
          transform: [
            { translateX: startPoint.x },
            { translateY: startPoint.y },
            { scale: pulse as unknown as number },
            { translateX: -startPoint.x },
            { translateY: -startPoint.y },
          ],
        }}
      >
        <Circle cx={startPoint.x} cy={startPoint.y} r={6} fill="#ffffff" />
      </AnimatedG>

      {/* End point (fade in near end) */}
      <AnimatedCircle cx={endPoint.x} cy={endPoint.y} r={6} fill="#ffffff" opacity={endOpacity as unknown as number} />
    </Svg>
  );
}
