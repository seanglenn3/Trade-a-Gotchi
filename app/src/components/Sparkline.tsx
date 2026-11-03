import { useEffect } from 'react';
import Animated, { useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { theme } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function Sparkline({ values }: { values: number[] }) {
  const points = downsample(values, 80);
  const glow = useSharedValue(0.35);
  useEffect(() => {
    glow.value = withRepeat(withTiming(0.9, { duration: 1200 }), -1, true);
  }, [glow]);
  const glowProps = useAnimatedProps(() => ({ opacity: glow.value }));
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const width = 320;
  const height = 128;
  const coords = points.map((value, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - 16 - ((value - min) / span) * (height - 28);
    return { x, y };
  });
  const d = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const fill = `${d} L ${width} ${height} L 0 ${height} Z`;
  const up = points[points.length - 1] >= points[0];
  const stroke = up ? theme.neon : theme.danger;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="under" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stroke} stopOpacity={0.35} />
          <Stop offset="1" stopColor={stroke} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={fill} fill="url(#under)" />
      <AnimatedPath animatedProps={glowProps} d={d} stroke={stroke} strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d={d} stroke={up ? theme.goldLight : '#FFE0E6'} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function downsample(values: number[], maxPoints: number): number[] {
  if (values.length <= maxPoints) return values;
  const out: number[] = [];
  const step = (values.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i += 1) out.push(values[Math.round(i * step)]);
  return out;
}
