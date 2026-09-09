import { expect, test } from 'vitest';

import { parseFontWeight, resolveBoldness } from './boldness';
import { DEFAULT_STORAGE } from './constants';
import type { BoldItStorage } from './types';

const store = (overrides: Partial<BoldItStorage> = {}): BoldItStorage => ({
    ...DEFAULT_STORAGE,
    ...overrides,
});

test('resolveBoldness prefers the domain override', () => {
    const data = store({ additionalBoldness: 100, specificDomains: { 'a.com': 500 } });

    expect(resolveBoldness(data, 'a.com')).toBe(500);
    expect(resolveBoldness(data, 'b.com')).toBe(100);
});

test('resolveBoldness falls back to the default when nothing is stored', () => {
    const data = store({ additionalBoldness: undefined as unknown as number });

    expect(resolveBoldness(data, 'a.com')).toBe(DEFAULT_STORAGE.additionalBoldness);
});

test('resolveBoldness keeps a zero override instead of treating it as unset', () => {
    const data = store({ additionalBoldness: 300, specificDomains: { 'a.com': 0 } });

    expect(resolveBoldness(data, 'a.com')).toBe(0);
});

test('parseFontWeight reads numeric weights', () => {
    expect(parseFontWeight('700')).toBe(700);
    expect(parseFontWeight('400')).toBe(400);
});

test('parseFontWeight maps keywords', () => {
    expect(parseFontWeight('bold')).toBe(700);
    expect(parseFontWeight('normal')).toBe(400);
    expect(parseFontWeight('lighter')).toBe(400);
});

test('parseFontWeight never returns NaN for a blank weight', () => {
    // `Number('')` is 0, not NaN, so a blank value used to slip into the numeric branch.
    expect(parseFontWeight('')).toBe(400);
    expect(parseFontWeight('   ')).toBe(400);
});
