import type { BoldItStorage, ChangeMessage } from './types';
import { log } from './utils/logger';
import { ChromeStorage } from './utils/chrome-storage';
import { DEFAULT_STORAGE } from './constants';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
document.addEventListener('DOMContentLoaded', async function () {
    const STORAGE_KEY = 'bold-it';
    const storage = new ChromeStorage<BoldItStorage>(STORAGE_KEY, DEFAULT_STORAGE);

    const powerButton = document.getElementById('power-button') as HTMLInputElement;
    const additionalBoldnessSlider = document.getElementById(
        'additional-boldness'
    ) as HTMLInputElement;
    const additionalBoldnessLabel = document.querySelector(
        '[for="additional-boldness"]'
    ) as HTMLLabelElement;

    const setLabelValue = (value: number | string) =>
        (additionalBoldnessLabel.textContent = `+ ${value}`);

    const sendMessageToActiveTab = (message: ChangeMessage['value']) => {
        chrome.tabs.query({}, function (tabs) {
            for (const tab of tabs) {
                const tabId = tab.id;
                if (!tabId) {
                    log.error('Found tab without an ID. Cannot send message.');
                    return;
                }

                // Send message to the content script of the active tab
                void chrome.tabs.sendMessage(tabId, { message: 'change', value: message });
            }
        });
    };

    // Writing to storage
    powerButton.addEventListener('change', function togglePower() {
        const isActive = powerButton.checked;
        sendMessageToActiveTab({ on: isActive, boldness: additionalBoldnessSlider.valueAsNumber });
    });

    additionalBoldnessSlider.addEventListener('input', function changeBoldnessLevel() {
        const additionalBoldness = additionalBoldnessSlider.valueAsNumber;
        powerButton.checked = true;
        setLabelValue(additionalBoldness);
        sendMessageToActiveTab({ on: true, boldness: additionalBoldness });
    });

    await storage.initPromise;

    function updateView() {
        const { additionalBoldness, isActive } = storage.get();
        powerButton.checked = isActive;
        const initialBoldness = additionalBoldness || DEFAULT_STORAGE.additionalBoldness;
        additionalBoldnessSlider.value = initialBoldness.toString();
        setLabelValue(initialBoldness);
    }

    updateView();
    document.addEventListener('focus', updateView);
});
