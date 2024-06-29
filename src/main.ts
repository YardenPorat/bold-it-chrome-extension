import { DEFAULT_STORAGE } from './constants';
import { BoldItStorage, ChangeMessage } from './types';
import { ChromeStorage } from './utils/chrome-storage';
import { log } from './utils/logger';

const STORAGE_KEY = 'bold-it';

const storage = new ChromeStorage<BoldItStorage>(STORAGE_KEY, DEFAULT_STORAGE);

const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'VIDEO',
    'AUDIO',
    'CANVAS',
    'IFRAME',
    'IMG',
    'BR',
    'HR',
    'COL',
    'EMBED',
    'svg',
    'g',
    'path',
    'use',
]);

function getCurrentFontWeight(element: HTMLElement): number {
    if (element.dataset.originalWeight) {
        return parseInt(element.dataset.originalWeight);
    }

    const currentFontWeight = window.getComputedStyle(element).fontWeight;

    // Check if font-weight is a number (some fonts use keywords like 'normal', 'bold')
    if (!isNaN(Number(currentFontWeight))) {
        return parseInt(currentFontWeight);
    }

    if (currentFontWeight === 'bold') {
        return 700;
    }

    return 400;
}

function boldIt(additionalBoldness: number) {
    const map = new Map();
    queryTextContainingElements().forEach((element) => {
        const original = getCurrentFontWeight(element);
        const newFontWeight = Math.min(original + additionalBoldness, 900);

        map.set(element, { original, newFontWeight });
    });

    map.forEach(({ original, newFontWeight }, element) => {
        element.style.fontWeight = newFontWeight.toString();
        element.dataset.originalWeight = original.toString();
    });
}

function unboldIt() {
    queryTextContainingElements().forEach((element) => {
        const original = element.dataset.originalWeight;
        if (original) {
            element.style.fontWeight = original;
            delete element.dataset.originalWeight;
        }
    });
}

function queryTextContainingElements() {
    return document.querySelectorAll<HTMLElement>(
        `body *:not(${Array.from(SKIP_TAGS).join(', ')})`
    );
}

function boldItWithStoredBoldness() {
    boldIt(storage.get()?.additionalBoldness ?? DEFAULT_STORAGE.additionalBoldness);
}

function setupListener() {
    chrome.runtime.onMessage.addListener((request: ChangeMessage) => {
        if (request.message === 'change') {
            const isActive = request.value.on;
            void storage.set({ isActive, additionalBoldness: request.value.boldness });
            if (isActive) {
                boldItWithStoredBoldness();
            } else {
                unboldIt();
            }
            return;
        }

        if (request.message === 'tabFocused') {
            storage.get().isActive ? boldItWithStoredBoldness() : unboldIt();
            return;
        }

        log.error(`Unknown message received ${String(request.message)}`);
    });
}

async function init() {
    await storage.initPromise;
    if (storage.get().isActive) {
        boldItWithStoredBoldness();
    }
}

setupListener();
void init();
