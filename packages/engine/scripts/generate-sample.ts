import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSampleDataset } from '../src/sample/generate';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../data/sample-eod.json');
mkdirSync(dirname(out), { recursive: true });
const data = generateSampleDataset();
writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
const bars = data.bars[data.symbols[0]]?.length ?? 0;
console.log(`Wrote ${out}`);
console.log(`symbols=${data.symbols.join(',')} sessions=${bars} range=${data.start}..${data.end}`);
