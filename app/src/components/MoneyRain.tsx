import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export function MoneyRain({ token, kind }: { token: number; kind: 'coins' | 'sparkle' }) {
  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 14 }, (_, index) => (
        <Drop key={`${token}-${index}`} index={index} token={token} kind={kind} />
      ))}
    </Animated.View>
  );
}

function Drop({ index, token, kind }: { index: number; token: number; kind: 'coins' | 'sparkle' }) {
  const y = useSharedValue(-40);
  const spin = useSharedValue(0);
  useEffect(() => {
    y.value = -30 - (index % 4) * 16;
    spin.value = 0;
    y.value = withDelay(index * 55, withTiming(260, { duration: 880 + (index % 5) * 70 }));
    spin.value = withDelay(index * 55, withTiming(180, { duration: 900 }));
  }, [index, spin, token, y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${spin.value}deg` }],
  }));
  const left = 8 + ((index * 37) % 210);
  const glyph = kind === 'sparkle' ? '✦' : '$';
  return (
    <Animated.View style={[styles.drop, { left }, style]}>
      {kind === 'coins' ? (
        <Svg width={22} height={22}>
          <Circle cx={11} cy={11} r={10} fill="#F5C451" />
          <Circle cx={11} cy={11} r={7} fill="#FFE7A3" />
          <SvgText x={11} y={15} textAnchor="middle" fontSize={11} fontWeight="700" fill="#072116">
            $
          </SvgText>
        </Svg>
      ) : (
        <Animated.Text style={styles.spark}>{glyph}</Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drop: { position: 'absolute', top: 0 },
  spark: { color: '#FFE7A3', fontSize: 18 },
});
