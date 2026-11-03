export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  body: string;
  takeaway: string;
}

/**
 * Original lesson cards. Short teaching notes for the toy — not excerpts from any book.
 */
export const LESSONS: readonly Lesson[] = [
  {
    id: 'paper-trading',
    title: 'Paper bowls and play money',
    minutes: 2,
    summary: 'A rehearsal you can write down. Nothing is sent to a real exchange.',
    body: 'A paper trade is a rehearsal. You write down a pretend order — what you would buy, when you would sell, and how much play money is at stake — then you wait to see what prices actually did. Nothing is sent to an exchange. That is the whole point of this toy: the bot can be brave, foolish, or boring, and a real wallet never hears about it. The habit worth keeping is bookkeeping. If you cannot explain a paper trade in one sentence ("I bought because the close was above its recent average, and I promised to leave if it fell 5%"), it was a guess. Guesses are allowed here. They are just not allowed to pretend they were a plan.',
    takeaway: 'A rule you can say out loud is already better than a hunch you only feel.',
  },
  {
    id: 'moving-averages',
    title: 'The average that follows price',
    minutes: 2,
    summary: 'Add the last N closes and divide. The line lags on purpose.',
    body: 'A moving average is a smoothed memory of recent prices. Add the last N closes, divide by N, and that is today’s N-day average. Tomorrow you drop the oldest close, add the new one, and the average takes a small step. When the latest price sits above that line, the recent past has been stronger than its own average — a plain way to say "this has been drifting up." It does not know the future, and it lags on purpose, because it is made only of closes that already printed. A short window twitches with every gust. A long one mostly notices seasons. In this toy, "price above the N-day average" buys only after a close clears the line, and the fill waits for the next session’s open.',
    takeaway: 'Averages describe the path behind you. They are not a promise about the path ahead.',
  },
  {
    id: 'rsi',
    title: 'A speedometer called RSI',
    minutes: 3,
    summary: 'A 0–100 dial comparing recent up-moves with recent down-moves.',
    body: 'The Relative Strength Index is a 0–100 dial for how hard recent up-moves have been compared with recent down-moves. It looks at day-to-day changes over a window (14 sessions is the classic setting), smooths them the way Welles Wilder described, and asks which side has been doing the talking. High readings mean recent gains dominated. Low readings mean recent losses dominated. People sometimes treat a low number like a sale sticker. That story is optional. A market can stay "low" while it keeps falling, or stay "high" during a long climb. Here, "RSI below X" lets the bot buy only when the dial is under a number you pick. If you also enable a trend card, both have to agree or the bot sits on its hands.',
    takeaway: 'RSI measures recent push, not value, and not what happens tomorrow.',
  },
  {
    id: 'breakouts',
    title: 'Stepping over an old high',
    minutes: 2,
    summary: 'A close above the highest high of the previous N sessions.',
    body: 'A breakout, in the plain sense used here, is a close that finishes above the highest high of the previous N sessions. The market just printed a price that recent range did not reach. Sometimes that lines up with new interest. Sometimes it is one noisy day that fails immediately — common enough that people gave it a name: a failed breakout. The N you pick is the height of the fence. Ten sessions is a low rail. Fifty is a tall one, cleared less often. This toy checks the prior N highs and does not include today, so the bot cannot congratulate itself for a high that is still forming. If the close clears the fence, the order still waits for the next open.',
    takeaway: 'A new high is a fact about the recent range. What it means is the part you are practicing.',
  },
  {
    id: 'volume',
    title: 'How many footprints',
    minutes: 2,
    summary: 'Volume counts what traded. It does not grade whether the crowd was wise.',
    body: 'Volume is the count of shares that changed hands during the session. It is not a mood ring for how excited people felt. It is how much actually traded. A price jump on tiny volume is a few footprints in a big field. The same jump on huge volume means a lot of inventory moved to print that price. A spike, in this toy, means today’s volume is larger than a multiple of the average volume from the previous N sessions — busier than its own recent habit. Busy does not equal good. Headlines, fund rebalances, and bad prints can all inflate the number. Turn the card on when you want the bot to demand a crowded day before it buys.',
    takeaway: 'Volume tells you how crowded the print was, not whether the crowd was right.',
  },
  {
    id: 'stop-losses',
    title: 'The exit you promise first',
    minutes: 3,
    summary: 'A percent below the entry where the bot must leave.',
    body: 'A stop loss is a promise, made before the trade exists, to leave if price falls a certain percent from the fill. It is decided early because the middle of a drop is a bad time to renegotiate with yourself. In this toy the stop is a percent of the entry. A 5% stop on a $100 fill sits at $95. The fills are simplified, and they try to be honest: if the day’s low tags the stop, the bot sells at the stop price. If the session opens already through the stop, it sells at the open, because $95 was never available. If a stop and a take-profit both land inside the same bar, the stop wins. A stop is not a guarantee that you will only lose that much. Gaps can lose more. It is a rule that keeps one trade from becoming a personality.',
    takeaway: 'Write the exit while you are calm. The toy will obey it when the candle looks scary.',
  },
  {
    id: 'position-sizing',
    title: 'How big a bite',
    minutes: 2,
    summary: 'Percent of paper equity spent on each new trade. No margin.',
    body: 'Position size is the rule that decides how much a mistake costs. A clever entry with a giant bite can still empty an account. A modest entry can be wrong over and over and still be around to learn. This toy sizes by percent of paper equity. Ten percent means each new trade tries to spend about a tenth of the account. It will never spend more cash than the bot actually holds — there is no margin in the playroom. Equity means cash plus the current value of open paper positions, so after a win the bites grow a little and after a loss they shrink. That is compounding, and it runs in both directions. When two tickers signal on the same day, the bot walks the list alphabetically until the cash runs out.',
    takeaway: 'Size is the volume knob on both luck and error. Turn it down while you learn the song.',
  },
  {
    id: 'drawdowns',
    title: 'The hole in the hill',
    minutes: 2,
    summary: 'How far equity fell from its highest point so far.',
    body: 'Drawdown is how far equity has fallen from the highest point it reached along the way, as a percent of that peak. If the paper account climbs to $6,000 and later sits at $4,800, the drawdown is 20% even if the balance is still above the original $5,000. Max drawdown is the deepest such hole on the path. Two bots can finish at the same balance and feel completely different if one arrived smoothly and the other was cut in half on the way. Deep holes are also slow to climb out of: a 50% drop needs a 100% gain just to see the old peak again. In this game, a deep hole makes the creature feel sick, and evolution looks at the hole as well as the win rate. A string of lucky wins that came with a terrifying dip is not treated as wisdom.',
    takeaway: 'The ending balance is the destination. Drawdown is what the trip felt like.',
  },
];

const BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));

export function listLessons(): Lesson[] {
  return LESSONS.map((lesson) => ({ ...lesson }));
}

export function getLesson(id: string): Lesson | undefined {
  const lesson = BY_ID.get(id);
  return lesson ? { ...lesson } : undefined;
}
