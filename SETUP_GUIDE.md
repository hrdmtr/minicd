# MiniCD セットアップガイド

このガイドでは、MiniCDアプリケーションをローカル環境でセットアップして実行する方法を説明します。

## 前提条件

- Docker と Docker Compose がインストールされていること
- Git がインストールされていること
- Node.js 16以上がインストールされていること（手動セットアップの場合）

## 方法1: Docker Compose を使用したセットアップ (推奨)

Docker Composeを使用すると、MongoDBとアプリケーションを一度に起動できます。

### 手順

1. リポジトリをクローン:
   ```bash
   git clone https://github.com/yourusername/minicd.git
   cd minicd
   ```

2. セットアップスクリプトを実行:
   ```bash
   ./setup.sh
   ```
   
   このスクリプトは以下を行います:
   - 必要なディレクトリの作成
   - `.env.example`から`.env`ファイルのコピー（存在しない場合）
   - Docker Composeによるアプリケーションの起動

3. アプリケーションは http://localhost:3000 で利用可能になります

4. Docker Composeのログを確認:
   ```bash
   docker-compose logs -f
   ```

5. アプリケーションの停止:
   ```bash
   docker-compose down
   ```

## 方法2: 手動セットアップ

### MongoDBのセットアップ

#### オプション1: Docker を使用してMongoDBを実行

1. MongoDBコンテナを起動:
   ```bash
   docker run -d -p 27017:27017 --name minicd-mongodb mongo:latest
   ```

2. データベースの状態を確認:
   ```bash
   docker logs minicd-mongodb
   ```

#### オプション2: ローカルにMongoDBをインストール

1. [MongoDB公式ドキュメント](https://docs.mongodb.com/manual/installation/)に従ってインストール

2. MongoDBサービスを起動:
   ```bash
   # Linuxの場合
   sudo systemctl start mongod
   
   # macOSの場合 (Homebrewでインストールした場合)
   brew services start mongodb-community
   ```

3. データベース接続を確認:
   ```bash
   mongosh
   ```

### MiniCDアプリケーションのセットアップ

1. リポジトリをクローン:
   ```bash
   git clone https://github.com/yourusername/minicd.git
   cd minicd
   ```

2. 依存関係をインストール:
   ```bash
   npm install
   ```

3. 環境設定ファイルを作成:
   ```bash
   cp .env.example .env
   ```

4. `.env`ファイルを編集して環境に合わせて設定:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/minicd
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   STORAGE_PATH=/tmp/minicd-deployments
   ```

5. アプリケーションをビルド:
   ```bash
   npm run build
   ```

6. アプリケーションを起動:
   ```bash
   # 本番モード
   npm start
   
   # または開発モード（ファイルの変更を監視）
   npm run dev
   ```

7. アプリケーションは http://localhost:3000 で利用可能になります

## アプリケーションの使用

### プロジェクトの作成

1. RESTクライアント（curlなど）を使用してプロジェクトを作成:
   ```bash
   curl -X POST http://localhost:3000/api/projects \
     -H "Content-Type: application/json" \
     -d '{
       "name": "my-application",
       "repositoryUrl": "https://github.com/username/repo.git",
       "branch": "main",
       "port": 8080
     }'
   ```

2. レスポンスからプロジェクトIDを記録

### GitHub Webhookの設定

1. GitHubリポジトリの設定ページに移動:
   `https://github.com/username/repo/settings/hooks`

2. "Add webhook"をクリック

3. 次のように設定:
   - Payload URL: `http://your-server-address:3000/api/webhooks/github`
   - Content type: `application/json`
   - Secret: `.env`ファイルで設定した`GITHUB_WEBHOOK_SECRET`と同じ値
   - イベント: "Push events"と"Pull request events"を選択

4. "Add webhook"をクリック

### 手動デプロイのトリガー

プロジェクトの手動デプロイをトリガーするには:
```bash
curl -X POST http://localhost:3000/api/projects/[project-id]/deploy
```

`[project-id]`は作成したプロジェクトのIDに置き換えてください。

## トラブルシューティング

### 接続の問題

MongoDBに接続できない場合:

1. MongoDBサービスが実行中か確認
2. `.env`ファイルの`MONGODB_URI`が正しいか確認
3. ファイアウォールがポート27017を許可しているか確認

### Docker関連の問題

Dockerコマンドが失敗する場合:

1. Dockerデーモンが実行中か確認: `docker info`
2. アプリケーションコンテナがDockerソケットにアクセスできるか確認
3. Dockerコマンドを実行する権限があるか確認

### ログの確認

詳細なログを確認するには:

1. Docker Compose実行時:
   ```bash
   docker-compose logs -f app
   ```

2. 手動実行時: コンソール出力を確認

## メンテナンス

### Docker関連クリーンアップ

不要なコンテナやイメージを削除:
```bash
# 停止したコンテナを削除
docker container prune

# 未使用イメージを削除
docker image prune

# ボリュームのクリーンアップ（注意: データが削除されます）
docker volume prune
```