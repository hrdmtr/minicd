# MiniCD

Docker アプリケーション向けの軽量な継続的デプロイメントサービスで、Render.com に似た機能を提供します。MiniCD は GitHub リポジトリを監視し、変更が検出されると自動的に Docker イメージをビルドしてコンテナをデプロイします。

## 特徴

- GitHub リポジトリのプッシュイベントとプルリクエストを監視
- Dockerfile から Docker イメージを自動的にビルド
- 設定可能なポートマッピングでコンテナをデプロイ
- デプロイ履歴とログを追跡
- プロジェクトとデプロイメントを管理するための RESTful API

## 必要条件

- Node.js 16+ と npm
- MongoDB
- Docker（ホストシステム上）
- Git

## 開始方法

詳細なセットアップ手順については、[SETUP_GUIDE.md](./SETUP_GUIDE.md)を参照してください。

### Docker Compose の使用（推奨）

最も簡単な始め方は Docker Compose を使用することです：

1. リポジトリをクローンする：
   ```
   git clone https://github.com/yourusername/minicd.git
   cd minicd
   ```

2. セットアップスクリプトを実行する：
   ```
   ./setup.sh
   ```
   
   これにより以下が実行されます：
   - 必要なディレクトリの作成
   - `.env.example` を `.env` にコピー（存在しない場合）
   - Docker Compose を使用してアプリケーションと MongoDB を起動

3. アプリケーションは http://localhost:3000 で利用可能になります

4. アプリケーションを停止するには：
   ```
   docker-compose down
   ```

### 手動セットアップ

Docker を使わずにアプリケーションを実行する場合：

1. リポジトリをクローンする：
   ```
   git clone https://github.com/yourusername/minicd.git
   cd minicd
   ```

2. 依存関係をインストールする：
   ```
   npm install
   ```

3. サンプルに基づいて `.env` ファイルを作成する：
   ```
   cp .env.example .env
   ```
   環境に合わせて値を更新してください。

4. MongoDB が実行されていることを確認する。

5. アプリケーションをビルドする：
   ```
   npm run build
   ```

6. サーバーを起動する：
   ```
   npm start
   ```
   
   または開発用に：
   ```
   npm run dev
   ```

## API エンドポイント

### プロジェクト

- `GET /api/projects` - すべてのプロジェクトを一覧表示
- `POST /api/projects` - 新しいプロジェクトを作成
- `GET /api/projects/:id` - プロジェクトの詳細を取得
- `PUT /api/projects/:id` - プロジェクトを更新
- `DELETE /api/projects/:id` - プロジェクトを削除
- `POST /api/projects/:id/deploy` - 手動デプロイメントをトリガー

### デプロイメント

- `GET /api/deployments/project/:projectId` - プロジェクトのデプロイメント一覧を取得
- `GET /api/deployments/:id` - デプロイメントの詳細を取得
- `GET /api/deployments/:id/logs` - デプロイメントログを取得

### Webhook

- `POST /api/webhooks/github` - GitHub webhook エンドポイント

## GitHub Webhook の設定

1. GitHub リポジトリで Settings > Webhooks > Add webhook に移動
2. ペイロード URL を `https://your-minicd-server.com/api/webhooks/github` に設定
3. コンテンツタイプを `application/json` に設定
4. シークレットを `GITHUB_WEBHOOK_SECRET` 環境変数と同じ値に設定
5. イベントを選択：プッシュイベントとプルリクエストイベント

## 環境変数

- `PORT` - サーバーポート（デフォルト：3000）
- `MONGODB_URI` - MongoDB 接続文字列
- `GITHUB_WEBHOOK_SECRET` - GitHub webhook を検証するためのシークレット
- `STORAGE_PATH` - クローンされたリポジトリを保存するパス

## ライセンス

MIT