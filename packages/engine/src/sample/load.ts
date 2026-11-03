import raw from '../../data/sample-eod.json';
import type { SampleDataset } from './generate';

/** Bundled synthetic sample so the toy runs with no network and no API key. */
export function loadSampleDataset(): SampleDataset {
  return raw as SampleDataset;
}
