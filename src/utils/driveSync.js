export class DriveSync {
    constructor(driveService) {
        this.driveService = driveService;
        this.isSyncing = false;
    }

    async syncPendingData() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const storage = await chrome.storage.local.get(null);
            const pendingData = Object.entries(storage)
                .filter(([key, data]) => key.startsWith('formData_') && data.pending);

            if (pendingData.length === 0) {
                return;
            }

            console.log(`Syncing ${pendingData.length} pending items...`);

            for (let [key, data] of pendingData) {
                const [_, folderName, fileName] = key.split('_');

                try {
                    await this.driveService.saveTrackedFields(
                        folderName,
                        fileName,
                        data.fields
                    );

                    await chrome.storage.local.set({
                        [key]: { ...data, pending: false }
                    });

                    console.log(`Synced to Drive: ${folderName}/${fileName}`);
                } catch (error) {
                    console.error(`Failed to sync ${key}:`, error);
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    async manualSync(folderName, fileName) {
        const storageKey = `formData_${folderName}_${fileName}`;
        const data = await chrome.storage.local.get(storageKey);
        console.log(`Data : ${JSON.stringify(data)}`)
        if (data[storageKey]) {
            return await this.driveService.saveTrackedFields(
                folderName,
                fileName,
                data[storageKey].fields
            );
        }
    }
}
