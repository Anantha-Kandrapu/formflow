import { FieldTracker } from "./fieldTracker";
import { FormObserver } from './formObserver';

export class TrackingManager {

    constructor() {
        this.fieldTracker = new FieldTracker();
        this.formObserver = new FormObserver(this.fieldTracker);
        this.active = false;
    }
    handleError(error, context) {
        console.error(`${context}:`, error);
        return {
            success: false,
            error: error.message,
            context: context
        };
    }
    start() {  // Renamed from startTracking to match ModeManager's usage
        this.active = true;
        this.formObserver.startObserving();
        this.attachEventListeners();
        console.log('TrackingManager started');
    }

    stop() {  // Renamed from stopTracking to match ModeManager's usage
        this.active = false;
        this.detachEventListeners();
        console.log('TrackingManager stopped');
    }

    getTrackedFields() {
        return Array.from(this.fieldTracker.trackedFields.values());
    }

    attachEventListeners() {
        document.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('change', this.handleChange.bind(this));
    }

    detachEventListeners() {
        document.removeEventListener('input', this.handleInput.bind(this));
        document.removeEventListener('change', this.handleChange.bind(this));
    }

    startTracking() {
        this.active = true;
        this.formObserver.startObserving();
        this.attachEventListeners();
        console.log('🎯 Tracking Started: Monitoring form fields...');
    }

    handleInput(event) {
        if (!this.active) return;
        const field = event.target;
        if (this.fieldTracker.isTrackableField(field)) {
            console.log('Input detected:', {
                type: field.type || field.tagName.toLowerCase(),
                value: field.value,
                element: field.tagName
            });
            this.fieldTracker.trackField(field);
        }
    }

    handleChange(event) {
        if (!this.active) return;
        const field = event.target;
        if (this.fieldTracker.isTrackableField(field)) {
            this.fieldTracker.trackField(field);
        }
    }

}
