import { TrackingManager } from '../tracking/TrackingManager';
import { ExecutionManager } from '../execution/ExecutionManager';
export class ModeManager {
    constructor() {
        this.currentMode = 'tracking';
        this.trackingManager = null;
        this.executionManager = null;
        this.loadInitialMode();
    }
    loadInitialMode() {
        chrome.storage.local.get(['mode'], (result) => {
            this.currentMode = result.mode || 'tracking';
            this.initializeMode();
            this.setupMessageListener();
        });
    }
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'modeChange') {
                this.currentMode = message.mode;
                chrome.storage.local.set({ mode: message.mode }, () => {
                    console.log(`Mode changed to: ${this.currentMode}`);
                    this.initializeMode();
                });
            }
        });
    }
    initializeMode() {
        if (this.currentMode === 'tracking') {
            this.initializeTracking();
        } else {
            this.initializeExecution();
        }
    }
    initializeTracking() {
        if (this.executionManager) {
            this.executionManager.stop();
            this.executionManager = null;
        }
        if (!this.trackingManager) {
            this.trackingManager = new TrackingManager();
        }
        this.trackingManager.start();
        console.log('Tracking mode initialized');
    }
    initializeExecution() {
        if (this.trackingManager) {
            this.trackingManager.stop();
            this.trackingManager = null;
        }
        if (!this.executionManager) {
            this.executionManager = new ExecutionManager();
        }
        if (!chrome?.storage?.local) {
            console.error('Chrome APIs not available, retrying in 1s...');
            setTimeout(this.initializeTracking, 1000);
            return;
        }
    
        this.executionManager.start();
        console.log('Execution mode initialized');
    }
    getCurrentMode() {
        return this.currentMode;
    }
    setMode(mode) {
        chrome.storage.local.set({ mode }, () => {
            this.currentMode = mode;
            this.initializeMode();
        });
    }
}
class ContentScript {
    constructor() {
        this.modeManager = new ModeManager();
    }
}

new ContentScript();


