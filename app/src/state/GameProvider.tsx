import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createDemoBot,
  fastForwardBot,
  feedLesson,
  hatchBot,
  loadSampleDataset,
  presentBot,
  previewRuleChange,
  stepBot,
  tradingDates,
  updateBotRules,
  windowEnding,
  type Bot,
  type RuleSet,
  type SampleDataset,
} from '@trade-a-gotchi/engine';

const STORAGE_KEY = 'trade-a-gotchi-v1';

export type CelebrationKind = 'hatch' | 'eat' | 'evolve' | 'win' | 'loss';

export interface Celebration {
  id: number;
  kind: CelebrationKind;
}

interface SaveFile {
  disclaimerAccepted: boolean;
  bot: Bot | null;
}

interface GameApi {
  ready: boolean;
  dataset: SampleDataset;
  disclaimerAccepted: boolean;
  bot: Bot | null;
  notice: string | null;
  celebration: Celebration | null;
  clearNotice: () => void;
  acceptDisclaimer: () => void;
  hatch: (name: string) => void;
  loadDemo: () => void;
  release: () => void;
  saveRules: (rules: RuleSet, watchlist: string[]) => void;
  feed: (lessonId: string) => void;
  step: (days: number) => void;
  continueToEnd: () => void;
  replay: (sessions: number | 'all') => void;
  rulePreview: () => { delta: number; message: string } | null;
}

const GameContext = createContext<GameApi | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const dataset = useMemo(() => loadSampleDataset(), []);
  const [ready, setReady] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [bot, setBot] = useState<Bot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const celebrationId = useRef(0);
  const spark = useCallback((kind: CelebrationKind | null) => {
    if (!kind) return;
    celebrationId.current += 1;
    setCelebration({ id: celebrationId.current, kind });
  }, []);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as SaveFile;
        setDisclaimerAccepted(Boolean(parsed.disclaimerAccepted));
        setBot(parsed.bot ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload: SaveFile = { disclaimerAccepted, bot };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [ready, disclaimerAccepted, bot]);

  const acceptDisclaimer = useCallback(() => setDisclaimerAccepted(true), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  const hatch = useCallback((name: string) => {
    const next = hatchBot(name);
    setBot(next);
    setNotice(`${next.name} hatched with a $5,000 paper account.`);
    spark('hatch');
  }, [spark]);

  const loadDemo = useCallback(() => {
    setDisclaimerAccepted(true);
    setBot(createDemoBot());
    setNotice('Pip woke up already grown, holding a journal of pretend trades on the sample prices.');
    spark('evolve');
  }, [spark]);

  const release = useCallback(() => {
    setBot(null);
    setNotice(null);
    setCelebration(null);
  }, []);

  const saveRules = useCallback(
    (rules: RuleSet, watchlist: string[]) => {
      if (!bot) return;
      const updated = updateBotRules(bot, rules, watchlist);
      const evolved = evolutionNote(bot, updated.bot);
      const discipline =
        updated.disciplineDelta < 0
          ? `Discipline ${updated.disciplineDelta}. The recipe changed again too soon.`
          : updated.disciplineDelta > 0
            ? `Discipline +${updated.disciplineDelta}. That was a patient edit.`
            : 'Recipe saved.';
      setBot(updated.bot);
      setNotice(evolved ?? discipline);
      spark(evolved ? 'evolve' : 'eat');
    },
    [bot, spark],
  );

  const feed = useCallback(
    (lessonId: string) => {
      if (!bot) return;
      const fed = feedLesson(bot, lessonId);
      const evolved = evolutionNote(bot, fed.bot);
      setBot(fed.bot);
      setNotice(evolved ?? (fed.gainedXp > 0 ? `Yum. +${fed.gainedXp} XP.` : 'Already eaten.'));
      spark(evolved ? 'evolve' : fed.gainedXp > 0 ? 'eat' : null);
    },
    [bot, spark],
  );

  const step = useCallback(
    (days: number) => {
      if (!bot) return;
      const next = stepBot(bot, dataset.bars, days);
      if (next.portfolio.cursor === bot.portfolio.cursor) {
        setNotice('The sample calendar is finished. Replay a window to practice that history again.');
        return;
      }
      const evolved = evolutionNote(bot, next);
      setBot(next);
      setNotice(evolved ?? `${next.name} sat through ${days === 1 ? 'one market day' : `${days} market days`}.`);
      spark(evolved ? 'evolve' : tradeReaction(bot, next));
    },
    [bot, dataset.bars, spark],
  );

  const continueToEnd = useCallback(() => {
    if (!bot) return;
    const next = fastForwardBot(bot, dataset.bars, { reset: false });
    if (next.portfolio.cursor === bot.portfolio.cursor) {
      setNotice('Already at the end of the sample.');
      return;
    }
    const evolved = evolutionNote(bot, next);
    setBot(next);
    setNotice(evolved ?? 'Fast-forwarded to the last sample day. The paper account was not reset.');
    spark(evolved ? 'evolve' : tradeReaction(bot, next));
  }, [bot, dataset.bars, spark]);

  const replay = useCallback(
    (sessions: number | 'all') => {
      if (!bot) return;
      const dates = tradingDates(dataset.bars, bot.watchlist);
      const span = sessions === 'all' ? { from: dates[0], to: dates[dates.length - 1] } : windowEnding(dates, sessions);
      if (!span?.from || !span.to) {
        setNotice('The watchlist has no sample prices.');
        return;
      }
      const next = fastForwardBot(bot, dataset.bars, { reset: true, from: span.from, to: span.to });
      const evolved = evolutionNote(bot, next);
      setBot(next);
      setNotice(
        evolved ?? `Replayed ${span.from} to ${span.to}. The paper account started over at $5,000. Rules stayed.`,
      );
      spark(evolved ? 'evolve' : tradeReaction(bot, next));
    },
    [bot, dataset.bars, spark],
  );

  const rulePreview = useCallback(() => (bot ? previewRuleChange(bot) : null), [bot]);

  const value = useMemo<GameApi>(
    () => ({
      ready,
      dataset,
      disclaimerAccepted,
      bot,
      notice,
      celebration,
      clearNotice,
      acceptDisclaimer,
      hatch,
      loadDemo,
      release,
      saveRules,
      feed,
      step,
      continueToEnd,
      replay,
      rulePreview,
    }),
    [
      ready,
      dataset,
      disclaimerAccepted,
      bot,
      notice,
      celebration,
      clearNotice,
      acceptDisclaimer,
      hatch,
      loadDemo,
      release,
      saveRules,
      feed,
      step,
      continueToEnd,
      replay,
      rulePreview,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must sit inside GameProvider.');
  return value;
}

function tradeReaction(before: Bot, after: Bot): CelebrationKind | null {
  const fresh = after.portfolio.trades.slice(before.portfolio.trades.length);
  if (fresh.length === 0) return null;
  return fresh[fresh.length - 1].pnl > 0 ? 'win' : 'loss';
}

function evolutionNote(before: Bot, after: Bot): string | undefined {
  const previous = presentBot(before).stage;
  const next = presentBot(after);
  if (previous === next.stage) return undefined;
  return `${after.name} grew into a ${next.stageLabel}! New rule cards may have unlocked.`;
}
