const fs = require('fs');

// Configuration for GitHub repository
const config = {
  owner: process.env.REPO_OWNER || 'default-owner',
  repo: process.env.FILE_STORAGE_REPO || 'file-storage',
  path: 'files', // Base path within the repo where files will be stored
};

// List all files in the repository
async function listFiles(octokit) {
  try {
    // Get repository contents for the specified path
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.path,
    });

    // If no files yet (just created repo)
    if (!Array.isArray(data)) {
      return [];
    }

    // Process each file to get additional info
    const files = await Promise.all(data.map(async (item) => {
      if (item.type !== 'file') return null;

      return {
        name: item.name,
        path: item.path,
        size: item.size,
        downloadUrl: item.download_url,
        date: new Date(), // GitHub API doesn't return creation date in contents API
        sha: item.sha,
      };
    }));

    return files.filter(file => file !== null);
  } catch (error) {
    // If the directory doesn't exist yet
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

// Upload files to GitHub repository
async function uploadFiles(octokit, files) {
  let uploadCount = 0;

  try {
    // Ensure the base directory exists
    await ensureDirectoryExists(octokit);

    // Upload each file
    for (const file of files) {
      const fileContent = fs.readFileSync(file.path, 'base64');
      const filePath = `${config.path}/${file.originalname}`;

      await octokit.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path: filePath,
        message: `Upload file: ${file.originalname}`,
        content: fileContent,
        committer: {
          name: 'GitHub File Sharing App',
          email: 'noreply@github.com',
        },
      });

      uploadCount++;
    }

    return uploadCount;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw new Error(`Failed to upload files to GitHub: ${error.message}`);
  }
}

// Delete a file from GitHub repository
async function deleteFile(octokit, path) {
  try {
    // Get the file's SHA (required for deletion)
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path,
    });

    // Delete the file
    await octokit.repos.deleteFile({
      owner: config.owner,
      repo: config.repo,
      path,
      message: `Delete file: ${path.split('/').pop()}`,
      sha: data.sha,
      committer: {
        name: 'GitHub File Sharing App',
        email: 'noreply@github.com',
      },
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// Ensure the base directory exists
async function ensureDirectoryExists(octokit) {
  try {
    // Check if the directory already exists
    await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.path,
    });
  } catch (error) {
    // If not found (404), create it
    if (error.status === 404) {
      await octokit.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path: `${config.path}/.gitkeep`,
        message: 'Initialize file storage directory',
        content: 'IyBGaWxlIFN0b3JhZ2UgRGlyZWN0b3J5Cg==', // Base64 encoded "# File Storage Directory"
        committer: {
          name: 'GitHub File Sharing App',
          email: 'noreply@github.com',
        },
      });
    } else {
      throw error;
    }
  }
}

module.exports = {
  listFiles,
  uploadFiles,
  deleteFile,
};