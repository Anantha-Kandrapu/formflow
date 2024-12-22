let currentMode = 'tracking';

// Listen for mode changes from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'modeChange') {
        currentMode = message.mode;
        console.log(`Mode changed to: ${currentMode}`);
        initializeMode();
    }
});

// Initialize mode-specific functionality
function initializeMode() {
    if (currentMode === 'tracking') {
        initializeTracking();
    } else {
        initializeExecution();
    }
}

function initializeTracking() {
    // TODO: Implement tracking mode functionality
    console.log('Tracking mode initialized');
}

function initializeExecution() {
    // TODO: Implement execution mode functionality
    console.log('Execution mode initialized');
}

chrome.storage.local.get(['mode'], function (result) {
    currentMode = result.mode || 'tracking';
    initializeMode();
});
