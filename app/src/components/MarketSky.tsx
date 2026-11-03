import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import type { MarketTone } from '@/marketTone';

const SKY: Record<MarketTone, [string, string, string]> = {
  up: ['#063D28', '#0A6A40', '#03150F'],
  down: ['#3A1024', '#1A2430', '#03150F'],
  flat: ['#06281C', '#0A3A2A', '#03150F'],
};

export function MarketSky({ tone }: { tone: MarketTone }) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(-180, { duration: 14000 }), -1, false);
  }, [drift]);
  const tape = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value }] }));
  const colors = SKY[tone];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        {Array.from({ length: 8 }, (_, index) => (
          <Line
            key={`h-${index}`}
            x1="0"
            x2="100%"
            y1={40 + index * 70}
            y2={40 + index * 70}
            stroke={tone === 'down' ? 'rgba(255,92,122,0.16)' : 'rgba(61,255,154,0.12)'}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 6 }, (_, index) => (
          <Circle key={`n-${index}`} cx={30 + index * 70} cy={80 + (index % 3) * 90} r={2.5} fill="#F5C451" opacity={0.55} />
        ))}
      </Svg>
      <Animated.View style={[styles.tape, tape]}>
        <Tape tone={tone} />
        <Tape tone={tone} />
      </Animated.View>
    </View>
  );
}

function Tape({ tone }: { tone: MarketTone }) {
  const mark = tone === 'down' ? '▼' : '▲';
  const color = tone === 'down' ? '#FF8AA0' : '#B8FFD8';
  return (
    <View style={styles.tapeRow}>
      {['SPY', 'AAPL', 'MSFT', 'NVDA', 'PAPER', 'GOLD'].map((symbol) => (
        <View key={symbol} style={styles.tick}>
          <Svg width={10} height={10}>
            <Circle cx={5} cy={5} r={4} fill="#F5C451" />
          </Svg>
          <Animated.Text style={[styles.tickText, { color }]}>
            {symbol} {mark}
          </Animated.Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tape: { position: 'absolute', top: 8, left: 0, flexDirection: 'row', opacity: 0.7 },
  tapeRow: { flexDirection: 'row', gap: 16, paddingRight: 16 },
  tick: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tickText: { fontSize: 11, letterSpacing: 1, fontFamily: 'ChakraPetch_700Bold' },
});
