# GitHub File Sharing

A web application that allows users to upload, share, and manage files using GitHub as storage.

## Features

- Upload files to a GitHub repository
- List, download, and delete files
- GitHub authentication integration
- Responsive design
- Automatic deployment with GitHub Actions

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- GitHub account
- GitHub Personal Access Token with repo permissions

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/github-file-share.git
cd github-file-share
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file with your GitHub information:
- `GITHUB_TOKEN`: Your GitHub personal access token
- `REPO_OWNER`: Your GitHub username
- `FILE_STORAGE_REPO`: Name of the repository to store files (create this repo first)

4. **Start the development server**

```bash
npm run dev
```

The application will be available at http://localhost:3000

### GitHub Actions Deployment

This project includes a GitHub Actions workflow to automatically deploy to GitHub Pages:

1. In your GitHub repository settings, add these secrets:
   - `GITHUB_TOKEN`: This is automatically provided by GitHub
   - `FILE_STORAGE_REPO`: Name of your file storage repository

2. Push to the main branch to trigger automatic deployment

## Usage

1. Open the application in your browser
2. Log in with your GitHub account
3. Upload files using the upload form
4. View, download, or delete your files in the file list

## License

MIT

## Notes

- Files are stored in the specified GitHub repository
- This application is intended for demonstration purposes
- For larger files or higher traffic, consider using a dedicated file storage service