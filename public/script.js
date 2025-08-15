document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const fileLabel = document.getElementById('file-label');
    const fileList = document.getElementById('file-list');
    const refreshBtn = document.getElementById('refresh-btn');
    const authSection = document.getElementById('auth-section');
    const uploadSection = document.getElementById('upload-section');
    const filesSection = document.getElementById('files-section');
    const userInfo = document.getElementById('user-info');
    const username = document.getElementById('username');
    const uploadProgress = document.getElementById('upload-progress');
    const progressBar = document.querySelector('.progress-bar');
    const progressPercent = document.getElementById('progress-percent');

    // GitHub API configuration
    const GITHUB_API_BASE = 'https://api.github.com';
    
    // Configuration - these will be set by user
    let REPO_OWNER = localStorage.getItem('repo_owner') || 'chengmatt416';
    let REPO_NAME = localStorage.getItem('repo_name') || 'file-storage';
    let FILES_PATH = 'files'; // Path within repo where files are stored

    // Check authentication status
    checkAuth();

    // Auth event listeners
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Setup drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileLabel.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileLabel.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileLabel.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        fileLabel.classList.add('highlight');
    }

    function unhighlight() {
        fileLabel.classList.remove('highlight');
    }

    fileLabel.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateFilePreview();
    }

    // Handle file selection
    fileInput.addEventListener('change', updateFilePreview);

    function updateFilePreview() {
        filePreview.innerHTML = '';
        
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';
                
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <span class="remove-file" data-index="${i}"><i class="fas fa-times"></i></span>
                `;
                
                filePreview.appendChild(fileItem);
            }
            
            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-file').forEach(btn => {
                btn.addEventListener('click', function() {
                    // This is visual only - cannot modify FileList
                    this.parentElement.remove();
                });
            });
        }
    }

    // Handle form submission
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (fileInput.files.length === 0) {
            showAlert('Please select at least one file to upload', 'error');
            return;
        }
        
        try {
            uploadProgress.style.display = 'block';
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
            
            const token = localStorage.getItem('github_token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            // Ensure the files directory exists
            await createFilesDirectory();
            
            const files = Array.from(fileInput.files);
            let uploadedCount = 0;
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = Math.round(((i + 0.5) / files.length) * 100);
                progressBar.style.width = progress + '%';
                progressPercent.textContent = `Uploading ${file.name}... ${progress}%`;
                
                await uploadFileToGitHub(file, token);
                uploadedCount++;
                
                const finalProgress = Math.round(((i + 1) / files.length) * 100);
                progressBar.style.width = finalProgress + '%';
                progressPercent.textContent = finalProgress + '%';
            }
            
            uploadProgress.style.display = 'none';
            showAlert(`Successfully uploaded ${uploadedCount} file(s) to GitHub`, 'success');
            uploadForm.reset();
            filePreview.innerHTML = '';
            loadFiles();
            
        } catch (error) {
            uploadProgress.style.display = 'none';
            showAlert(error.message, 'error');
        }
    });
    
    // Refresh file list
    refreshBtn.addEventListener('click', loadFiles);
    
    // Authentication functions
    async function checkAuth() {
        const token = localStorage.getItem('github_token');
        const user = localStorage.getItem('github_user');
        
        if (token && user) {
            try {
                // Validate token with GitHub API
                const response = await fetch(`${GITHUB_API_BASE}/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    localStorage.setItem('github_user', JSON.stringify(userData));
                    showUserInterface(userData);
                    loadFiles();
                } else {
                    handleLogout();
                }
            } catch (error) {
                console.error('Auth validation error:', error);
                handleLogout();
            }
        } else {
            showAuthInterface();
        }
    }
    
    function handleLogin() {
        // Show configuration modal for GitHub token
        showConfigModal();
    }
    
    function handleLogout() {
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_user');
        showAuthInterface();
    }
    
    // UI state functions
    function showAuthInterface() {
        authSection.style.display = 'block';
        uploadSection.style.display = 'none';
        filesSection.style.display = 'none';
        userInfo.style.display = 'none';
    }
    
    function showUserInterface(user) {
        authSection.style.display = 'none';
        uploadSection.style.display = 'block';
        filesSection.style.display = 'block';
        userInfo.style.display = 'flex';
        username.textContent = user.login;
    }
    
    // Load files from GitHub
    async function loadFiles() {
        try {
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading files...</p>
                </div>
            `;
            
            const token = localStorage.getItem('github_token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            // Try to get files from the repository
            const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILES_PATH}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            
            if (response.status === 404) {
                // Directory doesn't exist yet, create it
                await createFilesDirectory();
                updateFileListUI([]);
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to load files from GitHub');
            }
            
            const data = await response.json();
            const files = Array.isArray(data) ? data.filter(item => item.type === 'file').map(item => ({
                name: item.name,
                path: item.path,
                size: item.size,
                downloadUrl: item.download_url,
                date: new Date(item.sha), // Use SHA as a date approximation
                sha: item.sha
            })) : [];
            
            updateFileListUI(files);
            
        } catch (error) {
            showAlert(error.message, 'error');
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load files</p>
                </div>
            `;
        }
    }
    
    // Update file list UI
    function updateFileListUI(files) {
        if (!files || files.length === 0) {
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No files found in repository</p>
                </div>
            `;
            return;
        }
        
        fileList.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // Determine file type icon
            let fileIconClass = 'file-other';
            let fileTypeIcon = 'fa-file';
            
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (extension === 'pdf') {
                fileIconClass = 'file-pdf';
                fileTypeIcon = 'fa-file-pdf';
            } else if (['doc', 'docx'].includes(extension)) {
                fileIconClass = 'file-doc';
                fileTypeIcon = 'fa-file-word';
            } else if (['xls', 'xlsx'].includes(extension)) {
                fileIconClass = 'file-xls';
                fileTypeIcon = 'fa-file-excel';
            } else if (['ppt', 'pptx'].includes(extension)) {
                fileIconClass = 'file-ppt';
                fileTypeIcon = 'fa-file-powerpoint';
            } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) {
                fileIconClass = 'file-img';
                fileTypeIcon = 'fa-file-image';
            } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
                fileIconClass = 'file-zip';
                fileTypeIcon = 'fa-file-archive';
            }
            
            const formattedDate = new Date(file.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            fileItem.innerHTML = `
                <div class="file-name">
                    <div class="file-icon ${fileIconClass}"><i class="fas ${fileTypeIcon}"></i></div>
                    ${file.name}
                </div>
                <div class="file-size">${formatFileSize(file.size)}</div>
                <div class="file-date">${formattedDate}</div>
                <div class="file-actions">
                    <button class="action-btn download-btn" title="Download" data-url="${file.downloadUrl}">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete" data-path="${file.path}" data-name="${file.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            fileList.appendChild(fileItem);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                window.open(this.dataset.url, '_blank');
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (confirm(`Are you sure you want to delete ${this.dataset.name}?`)) {
                    await deleteFile(this.dataset.path);
                }
            });
        });
    }
    
    // Delete file from GitHub
    async function deleteFile(path) {
        try {
            const token = localStorage.getItem('github_token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            // First, get the file's current SHA (required for deletion)
            const getResponse = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            
            if (!getResponse.ok) {
                throw new Error('Failed to get file information for deletion');
            }
            
            const fileData = await getResponse.json();
            
            // Now delete the file
            const deleteResponse = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Delete file: ${path.split('/').pop()}`,
                    sha: fileData.sha,
                    committer: {
                        name: 'GitHub File Sharing App',
                        email: 'noreply@github.com'
                    }
                })
            });
            
            if (!deleteResponse.ok) {
                const error = await deleteResponse.json();
                throw new Error(error.message || 'Failed to delete file');
            }
            
            showAlert('File deleted successfully', 'success');
            loadFiles();
            
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
    
    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    }
    
    // Alert system (for demo)
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(alertDiv);
            }, 300);
        }, 3000);
    }
    
    // Helper function to create files directory in repository
    async function createFilesDirectory() {
        const token = localStorage.getItem('github_token');
        if (!token) {
            throw new Error('Authentication required');
        }
        
        try {
            // Check if directory already exists
            const checkResponse = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILES_PATH}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            
            if (checkResponse.ok) {
                return; // Directory already exists
            }
            
            // Create .gitkeep file to create the directory
            const gitkeepContent = btoa('# File Storage Directory\nThis directory stores uploaded files.\n');
            await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILES_PATH}/.gitkeep`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Initialize file storage directory',
                    content: gitkeepContent,
                    committer: {
                        name: 'GitHub File Sharing App',
                        email: 'noreply@github.com'
                    }
                })
            });
        } catch (error) {
            console.warn('Could not create files directory:', error);
        }
    }
    
    // Helper function to upload a single file to GitHub
    async function uploadFileToGitHub(file, token) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const fileContent = btoa(e.target.result);
                    const filePath = `${FILES_PATH}/${file.name}`;
                    
                    const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'X-GitHub-Api-Version': '2022-11-28',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Upload file: ${file.name}`,
                            content: fileContent,
                            committer: {
                                name: 'GitHub File Sharing App',
                                email: 'noreply@github.com'
                            }
                        })
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Failed to upload file');
                    }
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsBinaryString(file);
        });
    }
    
    // Show configuration modal for GitHub token
    function showConfigModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>GitHub Configuration</h3>
                <div class="form-group">
                    <label for="github-token">GitHub Personal Access Token:</label>
                    <input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxxxxxxxx" required>
                    <small>Token needs 'repo' permissions. <a href="https://github.com/settings/tokens" target="_blank">Create one here</a></small>
                </div>
                <div class="form-group">
                    <label for="repo-owner">Repository Owner (username):</label>
                    <input type="text" id="repo-owner" value="${REPO_OWNER}" required>
                </div>
                <div class="form-group">
                    <label for="repo-name">Repository Name:</label>
                    <input type="text" id="repo-name" value="${REPO_NAME}" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn secondary-btn" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="button" class="btn primary-btn" onclick="saveConfiguration()">Save & Login</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus on token input
        modal.querySelector('#github-token').focus();
    }
    
    // Save configuration and authenticate
    window.saveConfiguration = async function() {
        const token = document.getElementById('github-token').value.trim();
        const owner = document.getElementById('repo-owner').value.trim();
        const repo = document.getElementById('repo-name').value.trim();
        
        if (!token || !owner || !repo) {
            showAlert('Please fill in all fields', 'error');
            return;
        }
        
        // Update global variables
        REPO_OWNER = owner;
        REPO_NAME = repo;
        
        // Save to localStorage
        localStorage.setItem('github_token', token);
        localStorage.setItem('repo_owner', owner);
        localStorage.setItem('repo_name', repo);
        
        // Remove modal
        document.querySelector('.modal-overlay').remove();
        
        // Verify token and login
        try {
            const response = await fetch(`${GITHUB_API_BASE}/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid GitHub token');
            }
            
            const userData = await response.json();
            localStorage.setItem('github_user', JSON.stringify(userData));
            
            showUserInterface(userData);
            loadFiles();
            showAlert('Successfully authenticated with GitHub!', 'success');
            
        } catch (error) {
            showAlert(`Authentication failed: ${error.message}`, 'error');
            localStorage.removeItem('github_token');
            localStorage.removeItem('github_user');
        }
    };
});