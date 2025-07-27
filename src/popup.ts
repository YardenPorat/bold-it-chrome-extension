import type { BoldItStorage, ChangeMessage, SpecificDomainChangeMessage } from './types';
import { log } from './utils/logger';
import { ChromeStorage } from './utils/chrome-storage';
import { DEFAULT_STORAGE, DOMAIN_SPECIFIC_CHANGE_EVENT } from './constants';

document.addEventListener('DOMContentLoaded', async function () {
    const STORAGE_KEY = 'bold-it';
    const storage = new ChromeStorage<BoldItStorage>(STORAGE_KEY, DEFAULT_STORAGE);

    // Get the current active tab's hostname
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentDomain = tab?.url ? new URL(tab.url).hostname : '';

    const powerButton = document.getElementById('power-button') as HTMLInputElement;

    const general = {
        sliderContainer: document.querySelector('.general-slider-container') as HTMLInputElement,
        sliderInput: document.getElementById('general-slider') as HTMLInputElement,
        sliderLabel: document.querySelector('[for="general-slider"]') as HTMLLabelElement,
        hideSlider: () => {
            general.sliderContainer.style.display = 'none';
        },
        showSlider: () => {
            general.sliderContainer.style.display = '';
        },
    };

    const domain = {
        switch: document.getElementById('specific-domain-button') as HTMLInputElement,
        sliderContainer: document.querySelector('.domain-slider-container') as HTMLInputElement,
        sliderInput: document.getElementById('domain-slider-input') as HTMLInputElement,
        sliderLabel: document.querySelector('[for="domain-slider-input"]') as HTMLLabelElement,
        updateSlider: (boldness: number) => {
            domain.sliderInput.value = boldness.toString();
            setSpecificDomainBoldnessLabelValue(boldness);
        },
        hideSlider: () => {
            domain.sliderContainer.style.display = 'none';
        },
        showSlider: () => {
            domain.sliderContainer.style.display = '';
        },
    };

    const setGeneralLabelValue = (value: number | string) =>
        (general.sliderLabel.textContent = `+ ${value}`);

    const setSpecificDomainBoldnessLabelValue = (value: number | string) =>
        (domain.sliderLabel.textContent = `+ ${value}`);

    const sendChangeMessageToActiveTab = (message: ChangeMessage['value']) => {
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

    const sendSpecificDomainChangeMessageToActiveTab = (
        message: SpecificDomainChangeMessage['value']
    ) => {
        chrome.tabs.query({}, function (tabs) {
            for (const tab of tabs) {
                const tabId = tab.id;
                if (!tabId) {
                    log.error('Found tab without an ID. Cannot send message.');
                    return;
                }

                // Send message to the content script of the active tab
                void chrome.tabs.sendMessage(tabId, {
                    message: DOMAIN_SPECIFIC_CHANGE_EVENT,
                    value: message,
                });
            }
        });
    };

    // Writing to storage
    powerButton.addEventListener('change', function togglePower() {
        const isActive = powerButton.checked;
        isActive ? general.showSlider() : general.hideSlider();
        sendChangeMessageToActiveTab({
            on: isActive,
            boldness: general.sliderInput.valueAsNumber,
        });
    });

    domain.switch.addEventListener('change', function toggleSpecificDomain() {
        const isActive = domain.switch.checked;

        if (isActive) {
            domain.showSlider();
        } else {
            domain.hideSlider();
        }

        sendSpecificDomainChangeMessageToActiveTab({
            on: isActive,
            domain: currentDomain,
            boldness: DEFAULT_STORAGE.additionalBoldness,
        });
    });

    general.sliderInput.addEventListener('input', function changeBoldnessLevel() {
        const additionalBoldness = general.sliderInput.valueAsNumber;
        powerButton.checked = true;
        setGeneralLabelValue(additionalBoldness);
        sendChangeMessageToActiveTab({ on: true, boldness: additionalBoldness });
    });
    domain.sliderInput.addEventListener('input', function changeBoldnessLevel() {
        const domainBoldness = domain.sliderInput.valueAsNumber;
        domain.switch.checked = true;
        domain.updateSlider(domainBoldness);
        sendSpecificDomainChangeMessageToActiveTab({
            on: true,
            boldness: domainBoldness,
            domain: currentDomain,
        });
    });

    await storage.initPromise;

    async function updateView() {
        const { additionalBoldness, isActive, specificDomains } = storage.get();
        powerButton.checked = isActive;
        const initialBoldness = additionalBoldness || DEFAULT_STORAGE.additionalBoldness;
        isActive ? general.showSlider() : general.hideSlider();
        general.sliderInput.value = initialBoldness.toString();
        setGeneralLabelValue(initialBoldness);

        const specificDomainBoldness = specificDomains[currentDomain];
        const hasSpecificBoldness = !!specificDomainBoldness;
        domain.switch.checked = hasSpecificBoldness;
        hasSpecificBoldness ? domain.showSlider() : domain.hideSlider();
        domain.updateSlider(specificDomainBoldness || DEFAULT_STORAGE.additionalBoldness);
    }

    updateView();
    document.addEventListener('focus', () => updateView());
});
