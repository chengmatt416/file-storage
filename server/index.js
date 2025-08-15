const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
const githubService = require('./github-service');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (temporary storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)){
        fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../dist')));

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    req.githubToken = token;
    
    // Initialize Octokit with the token
    req.octokit = new Octokit({ auth: token });
    
    // Get user info to verify token
    await req.octokit.users.getAuthenticated();
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// API routes
app.get('/api/validate-token', authenticate, (req, res) => {
  res.json({ valid: true });
});

app.get('/api/files', authenticate, async (req, res) => {
  try {
    const files = await githubService.listFiles(req.octokit);
    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ message: 'Failed to list files from GitHub' });
  }
});

app.post('/api/upload', authenticate, upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = await githubService.uploadFiles(req.octokit, req.files);
    
    // Clean up temp files
    req.files.forEach(file => {
      fs.unlinkSync(file.path);
    });

    res.json({ 
      message: 'Files uploaded successfully',
      uploadedFiles: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: `Failed to upload: ${error.message}` });
  }
});

app.delete('/api/files', authenticate, async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ message: 'File path is required' });
    }

    await githubService.deleteFile(req.octokit, path);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: `Failed to delete: ${error.message}` });
  }
});

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});