# GitHub File Sharing

A client-side web application that allows users to upload, share, and manage files using GitHub as storage. This app runs entirely in the browser and connects directly to GitHub's API.

## 🚀 Live Demo

**[Access the deployed application here →](https://chengmatt416.github.io/file-storage/)**

![GitHub File Sharing App](https://github.com/user-attachments/assets/6641d95d-e7bc-4d5b-953b-2c6798bf8f85)

## Features

- 📁 Upload files directly to a GitHub repository
- 📋 List, download, and delete files
- 🔐 Secure GitHub Personal Access Token authentication
- 📱 Responsive design that works on all devices
- 🚀 Automatic deployment with GitHub Actions
- 🌐 Client-side only - no server required
- 💻 Direct GitHub API integration

## Quick Start

1. **Visit the app**: Go to [https://chengmatt416.github.io/file-storage/](https://chengmatt416.github.io/file-storage/)

2. **Create a GitHub token**: 
   - Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
   - Create a new token with **repo** permissions
   - Copy the token (starts with `ghp_`)

3. **Configure the app**:
   - Click "Configure GitHub Access" 
   - Enter your GitHub token
   - Enter your GitHub username
   - Enter the repository name where you want to store files

4. **Start using**:
   - Upload files using drag & drop or file selection
   - View, download, or delete your files
   - All files are stored in your GitHub repository under the `files/` directory

## Setup Instructions (For Development)

### Prerequisites

- Node.js (v14 or higher)
- GitHub account
- GitHub Personal Access Token with repo permissions

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/chengmatt416/file-storage.git
cd file-storage
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Serve locally**

```bash
npm run serve
```

The application will be available at http://localhost:8000

### GitHub Actions Deployment

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages:

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"

2. **Push to main branch** to trigger automatic deployment

3. **Access your deployed app** at `https://yourusername.github.io/your-repo-name/`

## How It Works

This is a **client-side only** application that:

1. **Authenticates** users with GitHub Personal Access Tokens
2. **Stores files** directly in a GitHub repository using GitHub's REST API
3. **Creates a `files/` directory** in your repository to organize uploaded files
4. **Handles all operations** (upload, list, delete) through direct API calls to GitHub
5. **Respects GitHub's API limits** and provides user feedback

## Security Notes

- ✅ Your GitHub token is stored only in your browser's localStorage
- ✅ All API calls are made directly from your browser to GitHub
- ✅ No server-side storage or processing
- ✅ You maintain full control over your data in your GitHub repository

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## API Usage

The app uses these GitHub API endpoints:
- `GET /repos/{owner}/{repo}/contents/{path}` - List files
- `PUT /repos/{owner}/{repo}/contents/{path}` - Upload files  
- `DELETE /repos/{owner}/{repo}/contents/{path}` - Delete files
- `GET /user` - Validate authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run serve`
5. Submit a pull request

## License

MIT

## Notes

- This application is intended for demonstration and light usage
- GitHub has API rate limits (5,000 requests per hour for authenticated users)
- For larger files or higher traffic, consider using a dedicated file storage service
- Files are stored as base64-encoded content in GitHub commits