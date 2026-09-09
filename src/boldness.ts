import { DEFAULT_STORAGE } from './constants';
import type { BoldItStorage } from './types';

export const MAX_FONT_WEIGHT = 900;

/** A per-domain override wins over the global value, which wins over the default. */
export function resolveBoldness(store: BoldItStorage, domain: string): number {
    return (
        store.specificDomains[domain] ??
        store.additionalBoldness ??
        DEFAULT_STORAGE.additionalBoldness
    );
}

/** A computed `font-weight` as a number. Some fonts report keywords instead of numbers. */
export function parseFontWeight(weight: string): number {
    const numeric = Number(weight);
    if (weight.trim() !== '' && !isNaN(numeric)) {
        return numeric;
    }

    if (weight === 'bold') {
        return 700;
    }

    return 400;
}
