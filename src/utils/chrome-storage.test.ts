import { expect, test } from 'vitest';

import { ChromeStorage } from './chrome-storage';

interface Settings {
    isActive: boolean;
    boldness: number;
}

const DEFAULTS: Settings = { isActive: true, boldness: 200 };
const KEY = 'bold-it';

/** Minimal stand-in for `chrome.storage.sync`, returning the same shapes the real callbacks do. */
function stubChromeStorage(initial: Record<string, unknown> = {}) {
    const synced: Record<string, unknown> = { ...initial };

    (globalThis as any).chrome = {
        storage: {
            sync: {
                get: (key: string | null, cb: (items: Record<string, unknown>) => void) =>
                    cb(key === null ? { ...synced } : { [key]: synced[key] }),
                set: (items: Record<string, unknown>, cb: () => void) => {
                    Object.assign(synced, items);
                    cb();
                },
                remove: (key: string, cb: () => void) => {
                    delete synced[key];
                    cb();
                },
            },
        },
    };

    return synced;
}

test('seeds the defaults when nothing is stored yet', async () => {
    const synced = stubChromeStorage();

    const storage = new ChromeStorage<Settings>(KEY, DEFAULTS);
    await storage.initPromise;

    expect(storage.get()).toEqual(DEFAULTS);
    expect(synced[KEY]).toEqual(DEFAULTS);
});

test('layers a partially stored value over the defaults', async () => {
    stubChromeStorage({ [KEY]: { boldness: 500 } });

    const storage = new ChromeStorage<Settings>(KEY, DEFAULTS);
    await storage.initPromise;

    expect(storage.get()).toEqual({ isActive: true, boldness: 500 });
});

test('set merges into the stored value instead of replacing it', async () => {
    const synced = stubChromeStorage({ [KEY]: { isActive: false, boldness: 300 } });

    const storage = new ChromeStorage<Settings>(KEY, DEFAULTS);
    await storage.initPromise;
    await storage.set({ boldness: 800 });

    expect(storage.get()).toEqual({ isActive: false, boldness: 800 });
    expect(synced[KEY]).toEqual({ isActive: false, boldness: 800 });
});

test('clear drops only this key', async () => {
    const synced = stubChromeStorage({ [KEY]: DEFAULTS, other: 1 });

    const storage = new ChromeStorage<Settings>(KEY, DEFAULTS);
    await storage.initPromise;
    await storage.clear();

    expect(KEY in synced).toBe(false);
    expect(synced.other).toBe(1);
});
