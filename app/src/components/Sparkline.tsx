import Svg, { Path } from 'react-native-svg';
import { theme } from '@/theme';

export function Sparkline({ values }: { values: number[] }) {
  const points = downsample(values, 80);
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const width = 320;
  const height = 110;
  const d = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - 8 - ((value - min) / span) * (height - 16);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const up = points[points.length - 1] >= points[0];
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path d={d} stroke={up ? theme.good : theme.bad} strokeWidth={3} fill="none" />
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
