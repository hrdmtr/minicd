#!/bin/bash
set -e

# 必要なディレクトリを作成
mkdir -p storage

# .envファイルの作成（存在しない場合）
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file from .env.example"
  echo "Please update the values in .env if needed"
fi

# Docker Composeで環境を起動
echo "Starting MiniCD with Docker Compose..."
docker-compose up -d

echo ""
echo "MiniCD setup complete!"
echo "The application is now running at http://localhost:3000"
echo ""
echo "API endpoints:"
echo "- Projects: http://localhost:3000/api/projects"
echo "- GitHub Webhook: http://localhost:3000/api/webhooks/github"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"