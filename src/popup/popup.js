document.addEventListener('DOMContentLoaded', function () {
    const modeToggle = document.getElementById('modeToggle');
    const modeText = document.getElementById('modeText');
    const statusText = document.getElementById('statusText');
    const clientIdInput = document.getElementById('clientId');
    const saveClientIdBtn = document.getElementById('saveClientId');
    const driveStatus = document.getElementById('driveStatus');
    const testConnectionBtn = document.getElementById('testConnection');

    // Load saved client ID
    chrome.storage.local.get(['googleClientId'], function (result) {
        if (result.googleClientId) {
            clientIdInput.value = result.googleClientId;
            testConnectionBtn.style.display = 'block';
            updateDriveStatus('Configured');
        }
    });

    // Save Client ID
    saveClientIdBtn.addEventListener('click', function () {
        const clientId = clientIdInput.value.trim();

        if (clientId) {
            chrome.storage.local.set({
                googleClientId: clientId
            }, function () {
                updateDriveStatus('Configured');
                testConnectionBtn.style.display = 'block';

                // Notify background script about new client ID
                chrome.runtime.sendMessage({
                    action: 'updateClientId',
                    clientId: clientId
                });
            });
        }
    });

    // Test Connection
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

    // Load initial state
    chrome.storage.local.get(['mode'], function (result) {
        const currentMode = result.mode || 'tracking';
        modeToggle.checked = currentMode === 'execution';
        updateModeText(currentMode);
    });

    // Handle mode toggle
    modeToggle.addEventListener('change', function () {
        const newMode = this.checked ? 'execution' : 'tracking';

        // Save mode to storage
        chrome.storage.local.set({ mode: newMode }, function () {
            updateModeText(newMode);

            // Notify background script
            chrome.runtime.sendMessage({
                action: 'modeChange',
                mode: newMode
            });
        });
    });

    function updateModeText(mode) {
        modeText.textContent = mode === 'execution' ? 'Execution Mode' : 'Tracking Mode';
        statusText.textContent = 'Active';
    }
});
