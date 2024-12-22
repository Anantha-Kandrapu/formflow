let googleClientId = null;
let driveService = null;

// Initialize default mode when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ mode: 'tracking' });
});

// Load saved client ID
chrome.storage.local.get(['googleClientId'], function (result) {
    if (result.googleClientId) {
        googleClientId = result.googleClientId;
        driveService = new DriveService(googleClientId);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'updateClientId':
            googleClientId = message.clientId;
            driveService = new DriveService(googleClientId);
            // Save to storage
            chrome.storage.local.set({ googleClientId: message.clientId });
            break;

        case 'testDriveConnection':
            testDriveConnection(sendResponse);
            return true; // Keep channel open for async response

        case 'modeChange':
            handleModeChange(message.mode);
            break;
    }
});

async function testDriveConnection(sendResponse) {
    if (!driveService) {
        sendResponse({ success: false, error: 'Drive service not initialized' });
        return;
    }

    try {
        const result = await driveService.testConnection();
        sendResponse(result);
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

function handleModeChange(mode) {
    // Only notify the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'modeChange',
                mode: mode
            });
        }
    });
}
