import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { Mood, Stage } from '@trade-a-gotchi/engine';

const GOLD = ['#FFE7A3', '#F5C451', '#C4891A'];

export function Creature({
  stage,
  mood,
  blink,
  chew,
}: {
  stage: Stage;
  mood: Mood;
  blink: boolean;
  chew: boolean;
}) {
  const sick = mood === 'sick';
  const bodyHi = sick ? '#9BB58A' : stage === 'legend' ? '#1FA36A' : stage === 'adult' ? '#18B874' : '#3DFF9A';
  const bodyLo = sick ? '#5E7358' : stage === 'egg' ? '#C4891A' : '#0B6B45';
  return (
    <Svg width={230} height={230} viewBox="0 0 230 230">
      <Defs>
        <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={bodyHi} />
          <Stop offset="1" stopColor={bodyLo} />
        </LinearGradient>
        <LinearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={GOLD[0]} />
          <Stop offset="0.55" stopColor={GOLD[1]} />
          <Stop offset="1" stopColor={GOLD[2]} />
        </LinearGradient>
      </Defs>
      {stage === 'legend' ? <Wings /> : null}
      {stage === 'egg' ? <Egg blink={blink} /> : <Body stage={stage} mood={mood} blink={blink} chew={chew} />}
      <Ellipse cx={115} cy={208} rx={46} ry={8} fill="#04140E" opacity={0.35} />
    </Svg>
  );
}

function Egg({ blink }: { blink: boolean }) {
  return (
    <G>
      <Ellipse cx={115} cy={124} rx={62} ry={76} fill="url(#gold)" />
      <Ellipse cx={96} cy={100} rx={16} ry={22} fill="#FFF6D2" opacity={0.55} />
      <Path d="M78 150 C92 138 104 168 118 154" stroke="#072116" strokeWidth={3} fill="none" />
      <Path d="M40 118 H68 M162 96 H198" stroke="#3DFF9A" strokeWidth={2} />
      <Circle cx={68} cy={118} r={3} fill="#3DFF9A" />
      <Circle cx={162} cy={96} r={3} fill="#3DFF9A" />
      <SvgText x={115} y={138} textAnchor="middle" fontSize={28} fontWeight="700" fill="#072116" opacity={0.8}>
        $
      </SvgText>
      <Eye cx={96} cy={112} blink={blink} mood="sleepy" />
      <Eye cx={134} cy={112} blink={blink} mood="sleepy" />
    </G>
  );
}

function Body({
  stage,
  mood,
  blink,
  chew,
}: {
  stage: Exclude<Stage, 'egg'>;
  mood: Mood;
  blink: boolean;
  chew: boolean;
}) {
  const rich = stage === 'adult' || stage === 'legend';
  return (
    <G>
      {stage === 'teen' || rich ? <Cap legend={stage === 'legend'} /> : <Antenna />}
      <Ellipse cx={115} cy={138} rx={64} ry={58} fill="url(#body)" stroke="#F5C451" strokeWidth={rich ? 4 : 2} />
      <Ellipse cx={96} cy={118} rx={14} ry={10} fill="#E9FFF4" opacity={0.28} />
      {stage !== 'adult' ? (
        <>
          <Eye cx={94} cy={128} blink={blink} mood={mood} />
          <Eye cx={136} cy={128} blink={blink} mood={mood} />
        </>
      ) : (
        <Visor blink={blink} />
      )}
      <Mouth mood={mood} chew={chew} />
      <Coin cx={115} cy={168} />
      {stage !== 'baby' ? <Coin cx={78} cy={156} small /> : null}
      {rich ? <Coin cx={152} cy={156} small /> : null}
      {stage === 'legend' ? <Crown /> : null}
      {mood === 'worried' || mood === 'sick' ? <Path d="M156 112 q6 -10 4 2" stroke="#7FE7FF" strokeWidth={3} fill="none" /> : null}
      <Ellipse cx={86} cy={196} rx={16} ry={8} fill="#072116" />
      <Ellipse cx={144} cy={196} rx={16} ry={8} fill="#072116" />
      {rich ? <Line x1={96} y1={196} x2={134} y2={196} stroke="#F5C451" strokeWidth={3} /> : null}
    </G>
  );
}

function Eye({ cx, cy, blink, mood }: { cx: number; cy: number; blink: boolean; mood: Mood }) {
  if (mood === 'sick') {
    return (
      <G>
        <Line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} stroke="#072116" strokeWidth={3} />
        <Line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} stroke="#072116" strokeWidth={3} />
      </G>
    );
  }
  if (blink || mood === 'sleepy' || mood === 'ecstatic') {
    return <Path d={`M${cx - 8} ${cy} Q${cx} ${cy + (mood === 'sad' ? -6 : 8)} ${cx + 8} ${cy}`} stroke="#072116" strokeWidth={3} fill="none" />;
  }
  const droop = mood === 'sad' || mood === 'worried' ? 2 : 0;
  return (
    <G>
      <Ellipse cx={cx} cy={cy + droop} rx={8} ry={mood === 'happy' ? 7 : 9} fill="#F4FFF8" />
      <Circle cx={cx + 1} cy={cy + droop} r={3.2} fill="#072116" />
      <Circle cx={cx + 3} cy={cy + droop - 2} r={1.2} fill="#FFFFFF" />
    </G>
  );
}

function Mouth({ mood, chew }: { mood: Mood; chew: boolean }) {
  if (chew) return <Ellipse cx={115} cy={150} rx={10} ry={7} fill="#072116" />;
  if (mood === 'sad') return <Path d="M100 156 Q115 146 130 156" stroke="#072116" strokeWidth={3} fill="none" />;
  if (mood === 'worried') return <Line x1={102} y1={152} x2={128} y2={152} stroke="#072116" strokeWidth={3} />;
  if (mood === 'sick') return <Path d="M100 150 Q108 158 115 148 Q122 158 130 150" stroke="#072116" strokeWidth={3} fill="none" />;
  if (mood === 'content') return <Path d="M104 150 Q115 158 126 150" stroke="#072116" strokeWidth={3} fill="none" />;
  return <Path d="M98 148 Q115 166 132 148" stroke="#072116" strokeWidth={3} fill="none" />;
}

function Coin({ cx, cy, small }: { cx: number; cy: number; small?: boolean }) {
  const r = small ? 10 : 16;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="url(#gold)" stroke="#8A5A10" strokeWidth={1.5} />
      <SvgText x={cx} y={cy + (small ? 4 : 6)} textAnchor="middle" fontSize={small ? 10 : 14} fontWeight="700" fill="#072116">
        $
      </SvgText>
    </G>
  );
}

function Antenna() {
  return (
    <G>
      <Line x1={115} y1={78} x2={115} y2={96} stroke="#072116" strokeWidth={3} />
      <Circle cx={115} cy={72} r={8} fill="url(#gold)" />
    </G>
  );
}

function Cap({ legend }: { legend: boolean }) {
  return (
    <G>
      <Path d="M58 112 Q115 58 172 112 L162 126 Q115 104 68 126 Z" fill="#072116" />
      <Path d="M78 104 H152" stroke="#3DFF9A" strokeWidth={2} />
      <Circle cx={152} cy={104} r={3} fill="#F5C451" />
      {legend ? <Circle cx={86} cy={96} r={3} fill="#F5C451" /> : null}
    </G>
  );
}

function Visor({ blink }: { blink: boolean }) {
  return (
    <G>
      <Ellipse cx={115} cy={128} rx={40} ry={16} fill="#04140E" stroke="#F5C451" strokeWidth={2} />
      <Circle cx={98} cy={128} r={blink ? 1.5 : 4} fill="#3DFF9A" />
      <Circle cx={132} cy={128} r={blink ? 1.5 : 4} fill="#3DFF9A" />
    </G>
  );
}

function Crown() {
  return (
    <G>
      <Coin cx={78} cy={78} small />
      <Coin cx={115} cy={64} small />
      <Coin cx={152} cy={78} small />
    </G>
  );
}

function Wings() {
  return (
    <G>
      <Path d="M52 140 Q20 110 28 168 Q48 160 58 148" stroke="#F5C451" strokeWidth={3} fill="rgba(245,196,81,0.18)" />
      <Path d="M178 140 Q210 110 202 168 Q182 160 172 148" stroke="#F5C451" strokeWidth={3} fill="rgba(245,196,81,0.18)" />
      <Path d="M36 130 H58 M196 130 H174" stroke="#3DFF9A" strokeWidth={2} />
    </G>
  );
}
