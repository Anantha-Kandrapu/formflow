import { FieldIdentifier } from "./fieldIdentifier";
export class FieldTracker {
    constructor() {
        this.trackedFields = new Map();
        this.observers = new Set();
    }
    trackField(field) {
        const fieldData = {
            type: field.type || field.tagName.toLowerCase(),
            identifiers: FieldIdentifier.getFieldIdentifiers(field),
            value: field.type === 'file' ? {
                type: 'fileUpload',
                name: field.files[0]?.name,
                size: field.files[0]?.size
            } : field.value,
            timestamp: Date.now()
        };
        this.trackedFields.set(field, fieldData);
        this.saveToLocalStorage(fieldData);
        console.log('📝 Field Tracked:', {
            type: fieldData.type,
            value: fieldData.value,
            identifiers: fieldData.identifiers
        });
        this.notifyObservers('fieldTracked', fieldData);
    }
    async getSaveConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['folderName', 'fileName'], (result) => {
                if (result.folderName && result.fileName) {
                    resolve({ folderName: result.folderName, fileName: result.fileName });
                } else {
                    resolve(this.getBackupName());
                }
            });
        });
    }
    async saveToLocalStorage(fieldData) {
        try {
            const config = await this.getSaveConfig();
            const storageKey = `formData_${config.folderName}_${config.fileName}`;
            chrome.storage.local.get(storageKey, (result) => {
                const existingData = result[storageKey] || { fields: [], pending: true };
                const existingFieldIndex = existingData.fields.findIndex(field =>
                    this.isSameField(field.identifiers, fieldData.identifiers)
                );
                if (existingFieldIndex !== -1) {
                    existingData.fields[existingFieldIndex] = {
                        ...fieldData,
                        updateHistory: [
                            ...(existingData.fields[existingFieldIndex].updateHistory || []),
                            {
                                value: existingData.fields[existingFieldIndex].value,
                                timestamp: existingData.fields[existingFieldIndex].timestamp
                            }
                        ]
                    };
                } else {
                    existingData.fields.push({
                        ...fieldData,
                        updateHistory: []
                    });
                }
                chrome.storage.local.set({
                    [storageKey]: {
                        ...existingData,
                        lastUpdated: Date.now()
                    }
                }, () => {
                    console.log(`Updated storage for ${storageKey}`);
                });
            });
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }
    isSameField(identifiers1, identifiers2) {
        return (
            (identifiers1.id && identifiers1.id === identifiers2.id) ||
            (identifiers1.name && identifiers1.name === identifiers2.name) ||
            (identifiers1.xpath && identifiers1.xpath === identifiers2.xpath)
        );
    }
    addObserver(observer) {
        this.observers.add(observer);
    }
    notifyObservers(event, data) {
        this.observers.forEach(observer => observer.update(event, data));
    }
    isTrackableField(field) {
        const trackableTypes = {
            'INPUT': ['text', 'number', 'email', 'file', 'checkbox', 'radio', 'tel'],
            'SELECT': ['select-one', 'select-multiple'],
            'TEXTAREA': ['textarea']
        };
        return trackableTypes[field.tagName]?.includes(field.type);
    }
    getBackupName() {
        const date = new Date();
        return {
            folderName: 'form_backups',
            fileName: `backup_${date.toISOString().split('T')[0]}_${date.getHours()}-${date.getMinutes()}`
        };
    }
    async getTrackedFields(folderName, fileName) {
        const storageKey = `formData_${folderName}_${fileName}`;
        return new Promise((resolve) => {
            chrome.storage.local.get(storageKey, (result) => {
                resolve(result[storageKey]?.fields || []);
            });
        });
    }
}
