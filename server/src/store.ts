import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Bot } from '@trade-a-gotchi/engine';

export interface BotStore {
  list(): Bot[];
  get(id: string): Bot | null;
  save(bot: Bot): void;
  remove(id: string): void;
  close(): void;
}

export function openStore(path: string): BotStore {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS bots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  const listStmt = db.prepare('SELECT payload FROM bots ORDER BY updated_at DESC');
  const getStmt = db.prepare('SELECT payload FROM bots WHERE id = ?');
  const saveStmt = db.prepare(`
    INSERT INTO bots (id, name, payload, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `);
  const removeStmt = db.prepare('DELETE FROM bots WHERE id = ?');

  return {
    list() {
      return listStmt.all().map((row) => parseBot((row as { payload: string }).payload));
    },
    get(id) {
      const row = getStmt.get(id) as { payload: string } | undefined;
      return row ? parseBot(row.payload) : null;
    },
    save(bot) {
      saveStmt.run(bot.id, bot.name, JSON.stringify(bot), new Date().toISOString());
    },
    remove(id) {
      removeStmt.run(id);
    },
    close() {
      db.close();
    },
  };
}

function parseBot(payload: string): Bot {
  return JSON.parse(payload) as Bot;
}
