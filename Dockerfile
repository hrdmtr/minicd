FROM node:16-alpine as builder

# 必要なパッケージをインストール
RUN apk add --no-cache git

# アプリディレクトリを作成
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci

# アプリケーションのソースをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# 本番環境用イメージ
FROM node:16-alpine

# Docker CLIをインストール
RUN apk add --no-cache docker-cli git

# アプリディレクトリを作成
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 本番環境の依存関係のみをインストール
RUN npm ci --only=production

# ビルドステージからビルド済みのファイルをコピー
COPY --from=builder /app/dist ./dist

# 保存ディレクトリの作成
RUN mkdir -p /app/storage

# アプリケーションを実行
CMD ["node", "dist/index.js"]