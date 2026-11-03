import { GAME_CONFIG, MOOD_QUIPS } from './config';
import { LESSONS } from './lessons';
import { tradeXpFrom } from './metrics';
import { clamp } from './money';
import { stageRank, unlockedCardTypes } from './rules';
import type { Bot, BotView, Mood, Stage, StageProgress, Stats } from './types';

export interface Vitals {
  health: number;
  happiness: number;
  mood: Mood;
}

export function totalXp(bot: Pick<Bot, 'lessonXp' | 'exploreXp' | 'portfolio'>): number {
  const { winTrade, lossTrade } = GAME_CONFIG.xp;
  return bot.lessonXp + bot.exploreXp + tradeXpFrom(bot.portfolio.trades, winTrade, lossTrade);
}

/**
 * Health leans on win rate, drawdown, and discipline.
 * Happiness mixes health with lessons and whether the bot has traded at all.
 * A brand-new hatch is content-to-happy, not punished for having an empty journal.
 */
export function computeVitals(input: {
  discipline: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  stats: Stats;
}): Vitals {
  const traded = input.stats.closedTrades > 0;
  const winScore = traded ? input.stats.winRate * 100 : 58;
  const drawdownPenalty = input.stats.maxDrawdown * 80;
  const health = clamp(42 + winScore * 0.4 + input.discipline * 0.22 - drawdownPenalty, 0, 100);
  const lessonRatio = input.lessonsTotal === 0 ? 0 : input.lessonsCompleted / input.lessonsTotal;
  const edge = traded ? (input.stats.winRate - 0.5) * 20 : 0;
  const happiness = clamp(28 + health * 0.35 + input.discipline * 0.2 + lessonRatio * 18 + edge, 0, 100);
  return { health, happiness, mood: moodFrom(health, happiness) };
}

export function moodFrom(health: number, happiness: number): Mood {
  if (health < 30) return 'sick';
  if (happiness >= 82 && health >= 65) return 'ecstatic';
  if (happiness >= 64) return 'happy';
  if (happiness >= 48) return 'content';
  if (happiness >= 34) return 'worried';
  return 'sad';
}

export function moodQuip(mood: Mood, seed: string): string {
  const lines = MOOD_QUIPS[mood];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return lines[hash % lines.length];
}

export interface ProgressContext {
  xp: number;
  health: number;
  discipline: number;
  stats: Stats;
}

export function unmetRequirements(stage: Stage, ctx: ProgressContext): string[] {
  const gate = GAME_CONFIG.stages.find((item) => item.id === stage);
  if (!gate) return ['Unknown stage'];
  const unmet: string[] = [];
  if (ctx.xp < gate.minXp) unmet.push(`${gate.minXp} XP (have ${ctx.xp})`);
  if (ctx.health < gate.minHealth) unmet.push(`health ${gate.minHealth} (have ${Math.round(ctx.health)})`);
  if (ctx.discipline < gate.minDiscipline) unmet.push(`discipline ${gate.minDiscipline} (have ${Math.round(ctx.discipline)})`);
  if (ctx.stats.closedTrades < gate.minClosedTrades) {
    unmet.push(`${gate.minClosedTrades} closed trades (have ${ctx.stats.closedTrades})`);
  }
  if (gate.minWinRate > 0 && ctx.stats.winRate + 1e-9 < gate.minWinRate) {
    const shown = ctx.stats.closedTrades === 0 ? 0 : Math.round(ctx.stats.winRate * 100);
    unmet.push(`win rate ${Math.round(gate.minWinRate * 100)}% (have ${shown}%)`);
  }
  if (ctx.stats.maxDrawdown > gate.maxDrawdown + 1e-9) {
    unmet.push(`drawdown at or under ${Math.round(gate.maxDrawdown * 100)}% (have ${Math.round(ctx.stats.maxDrawdown * 100)}%)`);
  }
  return unmet;
}

export function qualifiedStage(ctx: ProgressContext): Stage {
  let best: Stage = 'baby';
  for (const stage of GAME_CONFIG.stages) {
    if (stage.id === 'egg') continue;
    if (unmetRequirements(stage.id, ctx).length === 0) best = stage.id;
  }
  return best;
}

export function visibleStage(highestStage: Stage, qualified: Stage): Stage {
  return stageRank(qualified) > stageRank(highestStage) ? qualified : highestStage;
}

export function nextStageProgress(stage: Stage, ctx: ProgressContext): StageProgress | null {
  const index = stageRank(stage);
  const upcoming = GAME_CONFIG.stages[index + 1];
  if (!upcoming) return null;
  return { id: upcoming.id, label: upcoming.label, unmet: unmetRequirements(upcoming.id, ctx) };
}

export function stageLabel(stage: Stage): string {
  return GAME_CONFIG.stages.find((item) => item.id === stage)?.label ?? stage;
}

export function presentFrom(bot: Bot, stats: Stats): BotView {
  const xp = totalXp(bot);
  const vitals = computeVitals({
    discipline: bot.discipline,
    lessonsCompleted: bot.lessonsCompleted.length,
    lessonsTotal: LESSONS.length,
    stats,
  });
  const ctx: ProgressContext = { xp, health: vitals.health, discipline: bot.discipline, stats };
  const qualified = qualifiedStage(ctx);
  const stage = visibleStage(bot.highestStage, qualified);
  const seed = `${bot.id}:${bot.portfolio.cursor ?? 'egg'}:${stage}:${vitals.mood}`;
  return {
    ...bot,
    xp,
    stage,
    stageLabel: stageLabel(stage),
    health: roundVitals(vitals.health),
    happiness: roundVitals(vitals.happiness),
    mood: vitals.mood,
    quip: moodQuip(vitals.mood, seed),
    stats,
    unlockedCards: unlockedCardTypes(stage),
    nextStage: nextStageProgress(stage, ctx),
  };
}

function roundVitals(value: number): number {
  return Math.round(value * 10) / 10;
}

export function withStageProgress(bot: Bot, stats: Stats): Bot {
  const view = presentFrom(bot, stats);
  if (view.stage !== bot.highestStage) return { ...bot, highestStage: view.stage };
  return bot;
}
