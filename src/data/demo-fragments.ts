import type { Fragment } from '../types';
import quotesRaw from '../../seed/quotes.txt?raw';

export const demoFragments: Fragment[] = quotesRaw
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0)
  .map((text, i) => ({
    id: `frag-${i + 1}`,
    text,
  }));
