import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  useLongPressGesture,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Mood, Stage } from '@trade-a-gotchi/engine';
import type { Celebration } from '@/state/GameProvider';
import { font, theme } from '@/theme';
import { hapticHold, hapticLoss, hapticPlay, hapticTap, hapticWin } from '@/haptics';
import { Creature } from './Creature';
import { MoneyRain } from './MoneyRain';

const PET_LINES = [
  'Paper coins only. The shiny kind.',
  'That tickles the circuit.',
  'Careful, the gold is pretend.',
  'The ticker likes attention.',
];

export function InteractivePet({
  stage,
  mood,
  name,
  quip,
  effect,
  stats,
}: {
  stage: Stage;
  mood: Mood;
  name?: string;
  quip: string;
  effect: Celebration | null;
  stats?: { equity: string; winRate: string; drawdown: string };
}) {
  const [blink, setBlink] = useState(false);
  const [chew, setChew] = useState(false);
  const [line, setLine] = useState(quip);
  const [hearts, setHearts] = useState<{ id: number; x: number; glyph: string }[]>([]);
  const [held, setHeld] = useState(false);
  const dragged = useRef(0);
  const breath = useSharedValue(1);
  const bob = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(withTiming(1.045, { duration: 1100 }), -1, true);
    bob.value = withRepeat(withTiming(-7, { duration: 900 }), -1, true);
  }, [bob, breath]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLine(quip);
  }, [quip]);

  useEffect(() => {
    if (!effect) return;
    if (effect.kind === 'eat' || effect.kind === 'hatch') {
      setChew(true);
      const timer = setTimeout(() => setChew(false), 700);
      setLine(effect.kind === 'hatch' ? 'A paper account just hatched.' : 'Mmm. Rules taste like a plan.');
      return () => clearTimeout(timer);
    }
    if (effect.kind === 'win' || effect.kind === 'evolve') {
      spin.value = withSequence(
        withTiming(-8, { duration: 90 }),
        withRepeat(withTiming(8, { duration: 140 }), 5, true),
        withTiming(0, { duration: 120 }),
      );
      hapticWin();
      setLine(effect.kind === 'evolve' ? 'New gold. New cards.' : 'A winning print. I could dance.');
      burst(effect.kind === 'evolve' ? '✦' : '$');
    }
    if (effect.kind === 'loss') {
      dragY.value = withSequence(withTiming(10, { duration: 160 }), withSpring(0));
      hapticLoss();
      setLine('That one stung. The exit still kept its promise.');
    }
    return undefined;
  }, [dragY, effect, spin]);

  function burst(glyph: string) {
    const id = Date.now();
    setHearts([
      { id, x: 40, glyph },
      { id: id + 1, x: 110, glyph: glyph === '$' ? '✦' : '$' },
      { id: id + 2, x: 170, glyph },
    ]);
  }

  function pet() {
    hapticTap();
    breath.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1));
    const next = PET_LINES[Math.floor(Math.random() * PET_LINES.length)];
    setLine(next);
    burst('♥');
  }

  function play() {
    hapticPlay();
    spin.value = withSequence(withTiming(12, { duration: 120 }), withSpring(0));
    setLine('Wheee. Still paper. Still fun.');
    burst('$');
  }

  function hold() {
    hapticHold();
    setHeld((value) => !value);
    setLine(held ? quip : 'Long press peeks at the tape.');
  }

  const tap = useTapGesture({ runOnJS: true, maxDistance: 16, onActivate: pet });
  const holdGesture = useLongPressGesture({ runOnJS: true, minDuration: 460, maxDistance: 16, onActivate: hold });
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 18,
    onUpdate: (event) => {
      const x = event.translationX ?? 0;
      const y = event.translationY ?? 0;
      dragX.value = x;
      dragY.value = y;
      dragged.current = Math.hypot(x, y);
    },
    onFinalize: () => {
      const flung = dragged.current > 70;
      dragged.current = 0;
      dragX.value = withSpring(0);
      dragY.value = withSpring(0);
      if (flung) play();
    },
  });
  const gesture = useCompetingGestures(holdGesture, pan, tap);

  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value },
      { translateY: bob.value + dragY.value },
      { scale: breath.value },
      { rotate: `${spin.value}deg` },
    ],
  }));

  const rain = effect && (effect.kind === 'win' || effect.kind === 'evolve' || effect.kind === 'hatch') ? effect : null;

  return (
    <View style={styles.wrap} accessibilityRole="button" accessibilityLabel={`${name ?? 'Pet'}. Tap to pet, drag to play, hold for stats.`}>
      <Speech text={line} />
      {held && stats ? (
        <View style={styles.hud}>
          <Text style={styles.hudGold}>{stats.equity}</Text>
          <Text style={styles.hudText}>{stats.winRate} wins · drawdown {stats.drawdown}</Text>
        </View>
      ) : null}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.stage, motion]}>
          <Creature stage={stage} mood={mood} blink={blink} chew={chew} />
          {hearts.map((heart) => (
            <Floater key={heart.id} id={heart.id} x={heart.x} glyph={heart.glyph} />
          ))}
          {rain ? <MoneyRain token={rain.id} kind={rain.kind === 'evolve' ? 'sparkle' : 'coins'} /> : null}
          {(effect?.kind === 'eat' || effect?.kind === 'hatch') && <FlyingCard token={effect.id} />}
        </Animated.View>
      </GestureDetector>
      {name ? <Text style={styles.name}>{name}</Text> : null}
    </View>
  );
}

function Speech({ text }: { text: string }) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.bubbleText}>{text}</Text>
    </View>
  );
}

function Floater({ id, x, glyph }: { id: number; x: number; glyph: string }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);
  useEffect(() => {
    y.value = withTiming(-78, { duration: 800 });
    opacity.value = withTiming(0, { duration: 800 });
  }, [id, opacity, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: opacity.value }));
  return (
    <Animated.Text style={[styles.floater, { left: x }, style]}>{glyph}</Animated.Text>
  );
}

function FlyingCard({ token }: { token: number }) {
  const x = useSharedValue(130);
  const opacity = useSharedValue(1);
  useEffect(() => {
    x.value = 130;
    opacity.value = 1;
    x.value = withTiming(8, { duration: 620 });
    opacity.value = withTiming(0, { duration: 700 });
  }, [opacity, token, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], opacity: opacity.value }));
  return (
    <Animated.View style={[styles.card, style]}>
      <Text style={styles.cardMark}>$</Text>
      <Text style={styles.cardLabel}>RULE</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', minHeight: 280 },
  stage: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  name: { color: theme.gold, fontFamily: font.display, fontSize: 22, marginTop: -8 },
  bubble: {
    maxWidth: 260,
    backgroundColor: 'rgba(4, 20, 14, 0.92)',
    borderColor: theme.gold,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  bubbleText: { color: theme.goldLight, textAlign: 'center', fontFamily: font.sans, fontSize: 13, lineHeight: 18 },
  hud: {
    position: 'absolute',
    top: 58,
    right: 8,
    zIndex: 3,
    backgroundColor: 'rgba(4, 20, 14, 0.94)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.neon,
    padding: 8,
  },
  hudGold: { color: theme.gold, fontFamily: font.display, fontSize: 16 },
  hudText: { color: theme.text, fontFamily: font.sans, fontSize: 11 },
  floater: { position: 'absolute', top: 36, color: theme.gold, fontSize: 22 },
  card: {
    position: 'absolute',
    top: 90,
    right: 10,
    width: 54,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMark: { color: theme.onGold, fontFamily: font.display, fontSize: 14, lineHeight: 16 },
  cardLabel: { color: theme.onGold, fontSize: 8, letterSpacing: 1, fontFamily: font.sansBold },
});
