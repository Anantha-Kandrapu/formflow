import { TrackingManager } from '../tracking/TrackingManager';
import { ExecutionManager } from '../execution/ExecutionManager';

export class ModeManager {
    constructor() {
        this.currentMode = 'tracking';
        this.trackingManager = null;
        this.executionManager = null;
        this.loadInitialMode();  // Changed from initialize()
    }

    loadInitialMode() {
        // Read from local storage first
        chrome.storage.local.get(['mode'], (result) => {
            this.currentMode = result.mode || 'tracking';
            this.initializeMode();
            this.setupMessageListener();
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'modeChange') {
                // Update both memory and storage
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
        // Clean up previous mode
        if (this.executionManager) {
            this.executionManager.stop();
            this.executionManager = null;
        }

        // Initialize tracking mode
        if (!this.trackingManager) {
            this.trackingManager = new TrackingManager();
        }
        this.trackingManager.start();
        console.log('Tracking mode initialized');
    }
    handleError(error, context) {
        console.error(`${context}:`, error);
        return {
            success: false,
            error: error.message,
            context: context
        };
    }
    initializeExecution() {
        // Clean up previous mode
        if (this.trackingManager) {
            this.trackingManager.stop();
            this.trackingManager = null;
        }

        // Initialize execution mode
        if (!this.executionManager) {
            this.executionManager = new ExecutionManager();
        }
        this.executionManager.start();
        console.log('Execution mode initialized');
    }

    // Helper method to get current mode
    getCurrentMode() {
        return this.currentMode;
    }

    // Helper method to manually set mode
    setMode(mode) {
        chrome.storage.local.set({ mode }, () => {
            this.currentMode = mode;
            this.initializeMode();
        });
    }
}
