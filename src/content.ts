import { MAX_FONT_WEIGHT, parseFontWeight, resolveBoldness } from './boldness';
import { DEFAULT_STORAGE, DOMAIN_SPECIFIC_CHANGE_EVENT } from './constants';
import { BoldItStorage, ChangeMessage, SpecificDomainChangeMessage } from './types';
import { ChromeStorage } from './utils/chrome-storage';
import { log } from './utils/logger';

const STORAGE_KEY = 'bold-it';
const currentDomain = new URL(window.location.href).hostname;

const storage = new ChromeStorage<BoldItStorage>(STORAGE_KEY, DEFAULT_STORAGE);

const SKIP_TAGS = new Set(
    [
        'BODY',
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
    ].map((tag) => tag.toLowerCase())
);

function getCurrentFontWeight(element: HTMLElement): number {
    if (element.dataset.originalWeight) {
        return parseInt(element.dataset.originalWeight);
    }

    return parseFontWeight(window.getComputedStyle(element).fontWeight);
}

function unboldIt() {
    queryTextContainingElements().forEach((element) => {
        const original = element.dataset.originalWeight;
        if (original) {
            element.style.fontWeight = original;
        }
    });
}

function boldIt(additionalBoldness: number) {
    // unbold everything first, to avoid inheriting boldness from parent elements which were bolded in previous runs
    unboldIt();

    // two step process to avoid inheriting boldness from parent elements
    const map = new Map();

    queryTextContainingElements().forEach((element) => {
        const original = getCurrentFontWeight(element);
        const newFontWeight = Math.min(original + additionalBoldness, MAX_FONT_WEIGHT);

        map.set(element, { original, newFontWeight });
    });

    map.forEach(({ original, newFontWeight }, element) => {
        element.style.fontWeight = newFontWeight.toString();
        if (element.dataset.originalWeight === undefined) {
            element.dataset.originalWeight = original.toString();
        }
    });
}

function queryTextContainingElements() {
    return document.querySelectorAll<HTMLElement>(
        `body *:not(${Array.from(SKIP_TAGS).join(', ')})`
    );
}

function boldItWithStoredBoldness(data?: BoldItStorage) {
    const store = data ?? storage.get();
    boldIt(resolveBoldness(store, currentDomain));
}

function setupMessageListener() {
    chrome.runtime.onMessage.addListener(async (request: ChangeMessage) => {
        const initialStoreData = storage.get();
        const hasDomainBoldness = !!initialStoreData.specificDomains[currentDomain];

        if (request.message === 'change') {
            const isActive = (request as ChangeMessage).value.on;
            void storage.set({ isActive, additionalBoldness: request.value.boldness });
            if (!hasDomainBoldness) {
                isActive ? boldItWithStoredBoldness() : unboldIt();
            }
            return;
        }

        if (request.message === DOMAIN_SPECIFIC_CHANGE_EVENT) {
            const { boldness, domain, on } = (request as unknown as SpecificDomainChangeMessage)
                .value;

            if (!on) {
                const specificDomains = initialStoreData.specificDomains;
                delete specificDomains[domain];
                await storage.set({ specificDomains });
                unboldIt();
                init();
                return;
            }

            await storage.set({
                specificDomains: { ...initialStoreData.specificDomains, [domain]: boldness },
            });
            boldItWithStoredBoldness();
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

    const data = storage.get();
    const specificDomainBoldness = data.specificDomains[currentDomain];
    if (data.isActive || specificDomainBoldness) {
        boldItWithStoredBoldness(data);
    }
}

setupMessageListener();
['DOMContentLoaded', 'load'].forEach((event) => {
    addEventListener(event, () => setTimeout(init, 1000)); // hack for late rerendering
});
void init();
