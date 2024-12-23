document.addEventListener('DOMContentLoaded', function () {
    const folderNameInput = document.getElementById('folderName');
    const fileNameInput = document.getElementById('fileName');
    const saveToFolderButton = document.getElementById('saveToFolder');
    const trackedFieldsList = document.getElementById('trackedFieldsList');
    
    chrome.storage.local.get(['folderName', 'fileName'], function (result) {
        if (result.folderName) folderNameInput.value = result.folderName;
        if (result.fileName) fileNameInput.value = result.fileName;
    });
    folderNameInput.addEventListener('input', function () {
        chrome.storage.local.set({ folderName: this.value });
    });

    fileNameInput.addEventListener('input', function () {
        chrome.storage.local.set({ fileName: this.value });
    });

    saveToFolderButton.addEventListener('click', async () => {
        const folderName = folderNameInput.value;
        const fileName = fileNameInput.value;
        if (!folderName || !fileName) {
            alert('Please enter both folder name and file name');
            return;
        }
        console.log('💾 Attempting to save tracked fields:', {
            folder: folderName,
            file: fileName
        });
        chrome.runtime.sendMessage({
            action: 'manualSync',
            folderName: folderName,
            fileName: fileName
        }, (response) => {
            if (response.success) {
                console.log('✅ Successfully saved to Drive');
            } else {
                console.error('❌ Failed to save:', response.error);
            }
        });
    });
    function updateTrackedFieldsList(fields) {
        trackedFieldsList.innerHTML = fields.map(field => `
            <div class="tracked-field">
                <span>${field.type}: ${field.value}</span>
            </div>
        `).join('');
    }
    document.getElementById('modeToggle').addEventListener('change', (e) => {
        const newMode = e.target.checked ? 'execution' : 'tracking';
        chrome.runtime.sendMessage({
            action: 'modeChange',
            mode: newMode
        });
    });

    const modeText = document.getElementById('modeText');
    const driveStatus = document.getElementById('driveStatus');
    const testConnectionBtn = document.getElementById('testConnection');
    testConnectionBtn.addEventListener('click', function () {
        chrome.runtime.sendMessage({
            action: 'testDriveConnection'
        }, function (response) {
            if (response && response.success) {
                updateDriveStatus('Connected');
            } else {
                updateDriveStatus('Connection Failed');
            }
        });
    });
    function updateDriveStatus(status) {
        driveStatus.textContent = status;
        driveStatus.className = status.toLowerCase().includes('connected')
            ? 'connected'
            : 'not-connected';
    }
    chrome.storage.local.get(['mode'], function (result) {
        const currentMode = result.mode || 'tracking';
        modeToggle.checked = currentMode === 'execution';
        updateModeText(currentMode);
    });
    modeToggle.addEventListener('change', function () {
        const newMode = this.checked ? 'execution' : 'tracking';
        chrome.storage.local.set({ mode: newMode }, function () {
            updateModeText(newMode);
            chrome.runtime.sendMessage({
                action: 'modeChange',
                mode: newMode
            });
        });
    });
    function updateModeText(mode) {
        modeText.textContent = mode === 'execution' ? 'Execution Mode' : 'Tracking Mode';
    }
});
