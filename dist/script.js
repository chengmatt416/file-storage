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

    // API URL - will be set based on deployment
    const API_URL = location.hostname === 'localhost' || location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000' 
        : `https://${location.hostname}/api`;

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
            
            // Create FormData object
            const formData = new FormData();
            for (const file of fileInput.files) {
                formData.append('files', file);
            }
            
            // Get token from localStorage
            const token = localStorage.getItem('github_token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            // Upload files
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_URL}/upload`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            
            // Track upload progress
            xhr.upload.onprogress = function(event) {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    progressBar.style.width = percentComplete + '%';
                    progressPercent.textContent = percentComplete + '%';
                }
            };
            
            // Handle completion
            xhr.onload = function() {
                uploadProgress.style.display = 'none';
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    showAlert(`Successfully uploaded ${response.uploadedFiles} files to GitHub`, 'success');
                    uploadForm.reset();
                    filePreview.innerHTML = '';
                    loadFiles();
                } else {
                    const error = JSON.parse(xhr.responseText);
                    showAlert(error.message || 'Error uploading files', 'error');
                }
            };
            
            // Handle errors
            xhr.onerror = function() {
                uploadProgress.style.display = 'none';
                showAlert('Network error occurred during upload', 'error');
            };
            
            xhr.send(formData);
            
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
                // Validate token
                const response = await fetch(`${API_URL}/validate-token`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    showUserInterface(JSON.parse(user));
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
        // For demo purposes, we'll simulate GitHub OAuth
        // In a real app, you'd redirect to GitHub OAuth flow
        simulateGitHubAuth();
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
            
            const response = await fetch(`${API_URL}/files`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load files');
            }
            
            const data = await response.json();
            updateFileListUI(data.files);
            
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
            
            const response = await fetch(`${API_URL}/files`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path })
            });
            
            if (!response.ok) {
                const error = await response.json();
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
    
    // For demo only: Simulate GitHub OAuth
    function simulateGitHubAuth() {
        // In a real app, you'd redirect to GitHub OAuth
        // For demo, we'll simulate a successful authentication
        
        // Simulate token and user info
        const mockUser = {
            login: 'chengmatt416',
            id: 12345678,
            avatar_url: 'https://avatars.githubusercontent.com/u/12345678?v=4',
            name: 'Matt Cheng'
        };
        
        const mockToken = 'gh_' + Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
        
        // Save to localStorage
        localStorage.setItem('github_token', mockToken);
        localStorage.setItem('github_user', JSON.stringify(mockUser));
        
        // Update UI
        showUserInterface(mockUser);
        
        // Load files
        loadFiles();
    }
});