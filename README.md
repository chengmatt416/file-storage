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

### Deployment Options

This project supports multiple deployment platforms:

#### Option 1: Vercel (Recommended)
1. Connect your GitHub repository to [Vercel](https://vercel.com)
2. Configure environment variables in Vercel dashboard:
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `REPO_OWNER`: Your GitHub username  
   - `FILE_STORAGE_REPO`: Name of your file storage repository
3. Deploy automatically on every push to main branch

#### Option 2: Railway
1. Connect your GitHub repository to [Railway](https://railway.app)
2. Set the same environment variables as above
3. Railway will automatically detect the Node.js app and deploy

#### Option 3: Render
1. Connect your GitHub repository to [Render](https://render.com)
2. Use the `render.yaml` configuration file
3. Set environment variables in Render dashboard

#### GitHub Actions Deployment
For automated deployments, add these secrets to your GitHub repository:
- `VERCEL_TOKEN`: Your Vercel deployment token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

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