import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import type { Mood, Stage } from '@trade-a-gotchi/engine';
import { pixelColor, spriteFor } from './sprites';

export function BotSprite({ stage, mood, scale = 8 }: { stage: Stage; mood: Mood; scale?: number }) {
  const rows = spriteFor(stage, mood);
  const width = rows[0]?.length ?? 16;
  const height = rows.length;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -5,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ translateY: bob }] }}>
        <Svg width={width * scale} height={height * scale}>
          {mood === 'ecstatic' && (
            <>
              <Rect x={scale} y={0} width={scale} height={scale} fill="#FF6D8A" />
              <Rect x={0} y={scale} width={scale * 3} height={scale} fill="#FF6D8A" />
              <Rect x={scale} y={scale * 2} width={scale} height={scale} fill="#FF6D8A" />
            </>
          )}
          {rows.map((row, y) =>
            [...row].map((token, x) => {
              const fill = pixelColor(token, mood);
              if (!fill) return null;
              return <Rect key={`${x}-${y}`} x={x * scale} y={y * scale} width={scale} height={scale} fill={fill} />;
            }),
          )}
        </Svg>
      </Animated.View>
      <Svg width={width * scale} height={scale * 2}>
        <Ellipse cx={(width * scale) / 2} cy={scale} rx={scale * 4} ry={scale * 0.7} fill="#7DAF78" />
      </Svg>
    </View>
  );
}
