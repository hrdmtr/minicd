# MiniCD

A lightweight continuous deployment service for Docker applications, similar to Render.com. MiniCD monitors GitHub repositories and automatically builds and deploys Docker containers when changes are detected.

## Features

- Monitors GitHub repositories for push events and pull requests
- Automatically builds Docker images from Dockerfiles
- Deploys containers with configurable port mappings
- Tracks deployment history and logs
- RESTful API for managing projects and deployments

## Requirements

- Node.js 16+ and npm
- MongoDB
- Docker (on the host system)
- Git

## Getting Started

詳細なセットアップ手順については、[SETUP_GUIDE.md](./SETUP_GUIDE.md)を参照してください。

### Using Docker Compose (Recommended)

The easiest way to get started is using Docker Compose:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/minicd.git
   cd minicd
   ```

2. Run the setup script:
   ```
   ./setup.sh
   ```
   
   This will:
   - Create necessary directories
   - Copy `.env.example` to `.env` if it doesn't exist
   - Start the application and MongoDB using Docker Compose

3. The application will be available at http://localhost:3000

4. To stop the application:
   ```
   docker-compose down
   ```

### Manual Setup

If you prefer to run the application without Docker:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/minicd.git
   cd minicd
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the example:
   ```
   cp .env.example .env
   ```
   Update the values for your environment.

4. Make sure MongoDB is running.

5. Build the application:
   ```
   npm run build
   ```

6. Start the server:
   ```
   npm start
   ```
   
   Or for development:
   ```
   npm run dev
   ```

## API Endpoints

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project
- `POST /api/projects/:id/deploy` - Trigger a manual deployment

### Deployments

- `GET /api/deployments/project/:projectId` - List deployments for a project
- `GET /api/deployments/:id` - Get deployment details
- `GET /api/deployments/:id/logs` - Get deployment logs

### Webhooks

- `POST /api/webhooks/github` - GitHub webhook endpoint

## Setting Up GitHub Webhooks

1. In your GitHub repository, go to Settings > Webhooks > Add webhook
2. Set the Payload URL to `https://your-minicd-server.com/api/webhooks/github`
3. Set Content type to `application/json`
4. Set Secret to the same value as your `GITHUB_WEBHOOK_SECRET` environment variable
5. Select events: Push events and Pull request events

## Environment Variables

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `GITHUB_WEBHOOK_SECRET` - Secret for verifying GitHub webhooks
- `STORAGE_PATH` - Path for storing cloned repositories

## License

MIT
