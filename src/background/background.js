let googleClientId = "371180234330-8ad3kh8gpmldmhram35tvrhkhgrqc47b.apps.googleusercontent.com";
import { DriveService } from '../utils/driveService.js';
import { TrackingManager } from '../tracking/TrackingManager.js';
import { DriveSync } from '../utils/driveSync.js';
let driveSync = null;
let driveService = null;
let trackingManager = null;
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ mode: 'tracking' });
    initializeServices();
});
chrome.storage.local.get(['googleClientId'], function (result) {
    if (result.googleClientId) {
        googleClientId = result.googleClientId;
    }
    initializeServices();
});
function initializeServices() {
    driveService = new DriveService(googleClientId);
    driveSync = new DriveSync(driveService);
    trackingManager = new TrackingManager(driveService);
}
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.runtime.sendMessage({
        action: 'tabClosing',
        tabId: tabId
    });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'saveToFolder':
        case 'manualSync':
            if (!driveSync) {
                sendResponse({ success: false, error: 'DriveSync not initialized' });
                return true;
            }
            driveSync.manualSync(message.folderName, message.fileName)
                .then(sendResponse);
            return true;
        case 'saveTrackedFields':
            if (!trackingManager || !driveService) {
                sendResponse({ success: false, error: 'Services not initialized' });
                return true;
            }
            driveService.saveTrackedFields(
                message.folderName,
                message.fileName,
                trackingManager.getTrackedFields()
            ).then(sendResponse);
            return true;

        case 'testDriveConnection':
            testDriveConnection(sendResponse);
            return true;
        case 'modeChange':
            handleModeChange(message.mode);
            break;
    }
});
chrome.runtime.onSuspend.addListener(() => {
    if (driveSync) {
        driveSync.syncPendingData();
    }
});
async function testDriveConnection(sendResponse) {
    console.log('Testing Drive connection...');
    console.log('Current client ID:', googleClientId);
    if (!driveService) {
        console.error('Drive service not initialized');
        sendResponse({ success: false, error: 'Drive service not initialized' });
        return;
    }
    try {
        const result = await driveService.testConnection();
        console.log('Connection test result:', result);
        sendResponse(result);
    } catch (error) {
        console.error('Connection test error:', error);
        sendResponse({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
}
function handleModeChange(mode) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'modeChange',
                mode: mode
            });
        }
    });
}
