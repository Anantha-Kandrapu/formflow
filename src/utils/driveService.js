export class DriveService {
    constructor(clientId) {
        this.clientId = clientId;
    }
    async authenticate() {
        try {
            const token = await chrome.identity.getAuthToken({
                interactive: true
            });
            // token might be coming back as an object instead of string
            // Add logging to check what we're getting
            console.log('Auth token response:', token);

            // Fix: Make sure we're using the token correctly
            if (typeof token === 'object' && token.token) {
                return { success: true, token: token.token };
            } else if (typeof token === 'string') {
                return { success: true, token: token };
            }

            throw new Error('Invalid token format');
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: error.message };
        }
    }

    async createOrGetFolder(folderName) {
        const auth = await this.authenticate();
        if (!auth.success) throw new Error('Authentication failed');

        // Search for existing folder
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
            {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            }
        );

        const searchResult = await searchResponse.json();

        if (searchResult.files.length > 0) {
            return searchResult.files[0].id;
        }

        // Create new folder if doesn't exist
        const metadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
        };

        const createResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            }
        );

        const folder = await createResponse.json();
        return folder.id;
    }

    async saveFormData(folderName, fileName, trackedFields) {
        try {
            const folderId = await this.createOrGetFolder(folderName);

            const metadata = {
                name: `${fileName}.json`,
                parents: [folderId],
                description: 'Form tracking data ${folderId}/${fileName}',
                properties: {
                    timestamp: Date.now(),
                    createdAt: new Date().toISOString(),
                    numberOfFields: trackedFields.length
                }
            };

            // Create multipart request for JSON data
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([JSON.stringify(trackedFields)], { type: 'application/json' }));

            const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${auth.token}`
                    },
                    body: form
                }
            );

            return response.json();
        } catch (error) {
            console.error('Error saving form data:', error);
            throw error;
        }
    }

    async uploadFile(folderName, fileName, file) {
        const folderId = await this.createOrGetFolder(folderName);

        const metadata = {
            name: fileName,
            parents: [folderId],
            mimeType: file.type
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: form
            }
        );

        return response.json();
    }
    handleError(error, context) {
        console.error(`${context}:`, error);
        return {
            success: false,
            error: error.message,
            context: context
        };
    }

    /**
 * Saves tracked form fields and files to Google Drive
 * @param {string} folderName - Name of the folder to store data in
 * @param {string} fileName - Name for the JSON file (without extension)
 * @param {Array<Object>} trackedFields - Array of tracked form fields
 * @param {string} trackedFields[].type - Type of form field ('text', 'file', etc.)
 * @param {Object} trackedFields[].value - Field value or file information
 * @param {Object} trackedFields[].identifiers - Field identifiers for form filling
 * @returns {Promise<Object>} Result object
 * @returns {boolean} result.success - Whether the save was successful
 * @returns {string} [result.fileId] - ID of the saved JSON file
 * @returns {number} [result.filesUploaded] - Number of files uploaded
 * @returns {string} [result.error] - Error message if save failed
 * @throws {Error} When authentication fails
 * @example
 * const fields = [
 *   { type: 'text', value: 'John', identifiers: { id: 'name' } },
 *   { 
 *     type: 'file', 
 *     value: { 
 *       name: 'resume.pdf', 
 *       file: File, 
 *       type: 'application/pdf' 
 *     },
 *     identifiers: { id: 'resume' }
 *   }
 * ];
 * const result = await driveService.saveTrackedFields('myFolder', 'form1', fields);
 */
    async saveTrackedFields(folderName, fileName, trackedFields) {
        try {
            const auth = await this.authenticate();
            if (!auth.success) throw new Error('Authentication failed');

            const folderId = await this.createOrGetFolder(folderName);
            // Separate regular fields and file fields
            const regularFields = trackedFields.filter(field => field.type !== 'file');
            const fileFields = trackedFields.filter(field => field.type === 'file');

            // Save regular form data
            const metadata = {
                name: `${fileName}.json`,
                parents: [folderId],
                description: 'Form tracking data',
                properties: {
                    timestamp: Date.now(),
                    createdAt: new Date().toISOString(),
                    numberOfFields: trackedFields.length,
                    hasFiles: fileFields.length > 0
                }
            };
            console.log(`Meta Data : ${metadata}`)
            // Create multipart request for form data
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([JSON.stringify({
                regularFields,
                fileReferences: fileFields.map(field => ({
                    ...field,
                    value: `${folderName}/${field.value.name}` // Store file path reference
                }))
            })], { type: 'application/json' }));

            const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${auth.token}`
                    },
                    body: form
                }
            );
            console.log(response.status, response.statusText);
            if (!response.ok) throw new Error('Failed to save tracked fields');

            // If there are files, upload them
            if (fileFields.length > 0) {
                console.log('Uploading files:', fileFields.length);
                for (const field of fileFields) {
                    const fileMetadata = {
                        name: field.value.name,
                        parents: [folderId],
                        description: `File upload for ${fileName}`
                    };

                    const fileForm = new FormData();
                    fileForm.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
                    fileForm.append('file', field.value.file);

                    const fileResponse = await fetch(
                        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${auth.token}`
                            },
                            body: fileForm
                        }
                    );

                    if (!fileResponse.ok) {
                        console.error('Failed to upload file:', field.value.name);
                    }
                }
            }

            return {
                success: true,
                fileId: (await response.json()).id,
                filesUploaded: fileFields.length
            };
        } catch (error) {
            console.error('Error saving tracked fields:', error);
            return { success: false, error: error.message };
        }
    }

    async testConnection() {
        try {
            console.log('Starting connection test...');
            const auth = await this.authenticate();
            console.log('Auth result:', auth);  // Add this log

            if (!auth.success) {
                throw new Error(`Authentication failed: ${auth.error}`);
            }

            // Make sure we're using the token correctly in the header
            const response = await fetch(
                'https://www.googleapis.com/drive/v3/files?pageSize=1',
                {
                    headers: {
                        'Authorization': `Bearer ${auth.token}`
                    }
                }
            );

            console.log('Drive API response:', response);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Drive API error:', errorText);
                throw new Error(`Drive API request failed: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Connection test detailed error:', error);
            return {
                success: false,
                error: error.message,
                details: error.stack
            };
        }
    }
}
