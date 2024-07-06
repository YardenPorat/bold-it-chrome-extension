const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function onTabFocus(activeInfo: chrome.tabs.TabActiveInfo) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab) {
            void chrome.tabs.sendMessage(activeInfo.tabId, { message: 'tabFocused' });
        }
    });
}
let isListening = false;

async function init() {
    while (!isListening) {
        try {
            chrome.tabs.onActivated.addListener(onTabFocus);
            isListening = true;
        } catch (e) {
            console.error(e);
            await sleep(500);
        }
    }
}

init();
