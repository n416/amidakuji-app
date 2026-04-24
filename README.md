# ダイナミックあみだくじ (amidakuji-app)

リアルタイムでアニメーションが同期する、複数人参加型の動的あみだくじアプリケーションです。参加者がそれぞれ自分の画面からくじの「線（ハシゴ）」を引くことができ、誰かが線を引くたびに全員の画面にリアルタイムで反映されます。

## システム構成

本アプリケーションは、大規模なリニューアルを経て、コストパフォーマンスとパフォーマンスに優れたモダンなサーバーレスアーキテクチャ（エッジコンピューティング）に移行しました。

- **バックエンドAPI**: Cloudflare Workers + Hono (旧 Google App Engine / Express.js から完全移行)
- **フロントエンド（UI）**: Cloudflare Workers Assets Binding (SSR/EJSを廃止し、SPA/Static HTMLへ移行)
- **リアルタイム同期**: Firebase Firestore (フロントエンドから `onSnapshot` による直接リッスン)
- **認証機構**: 
  - **Google OAuth連携**: Honoによる独自実装で、バックエンド側でJWTセッション管理。
  - **Firebase Anonymous Login**: フロントエンドからFirestoreへの安全な Read-Only リアルタイム接続用。
  - **合言葉（グループパスワード）**: サーバーサイドCookie (`verifiedGroups`) による堅牢なアクセス制御ゲートウェイ。

---

## 開発環境のセットアップ

### 前提条件
- Node.js (v18以降を推奨)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### 1. インストール
```bash
npm install
```

### 2. 環境変数の設定
ローカル開発用に `.dev.vars` ファイルをプロジェクトのルートに作成し、以下の秘匿情報を設定してください。
*(※ セキュリティのため、`.dev.vars` は `.gitignore` に登録されておりコミットされません。)*

```env
FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"...","measurementId":"..."}
GCS_BUCKET_NAME="amidakuji-app-native-bucket"
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
SESSION_SECRET="..."
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"..."}'
```

### 3. ローカルサーバーの起動
以下のコマンドで Wrangler のローカル開発サーバーが立ち上がります。

```bash
npm run dev
# または npm start
```
起動後、ブラウザから `http://localhost:8787` にアクセスして動作確認を行います。

---

## ビルド・デプロイ方法

### スタイルシート (SCSS) のコンパイル
デザイン修正等で `scss` フォルダ内のファイルを変更した場合は、以下のコマンドで CSS にコンパイルします。

```bash
# 手動コンパイル（1回のみ）
npm run build:css

# 自動監視コンパイル（開発中ずっと）
npm run scss
```

### 本番環境（Cloudflare）へのデプロイ
Wranglerを使用して、Cloudflare Workers のグローバルネットワーク上にデプロイします。

```bash
npm run deploy
```

#### ⚠️ シークレット（環境変数）の本番登録について
ローカルの `.dev.vars` は本番環境にはアップロードされません。**初めてデプロイする際（または値を変更した際）**は、必ず Cloudflare 側に以下のコマンドでシークレット変数を登録してください。

```bash
npx wrangler secret put FIREBASE_CONFIG
npx wrangler secret put GCS_BUCKET_NAME
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
```
*(※ `FIREBASE_SERVICE_ACCOUNT` は複数行のJSONを含みますが、ターミナルでコピペするとエラーになるため、改行を削除した1行のJSON文字列を使用するか、PowerShell等の機能でファイルから直接流し込んでください。)*

---

## 技術的な留意点・設計の工夫

1. **Firestoreの権限分離 (Security Rules)**
   データの「作成・更新・削除」はすべて Cloudflare Workers のバックエンドAPI（Firebase Admin SDK経由）で行います。フロントエンドからは「閲覧のみ（`onSnapshot`）」を許可するハイブリッド設計により、堅牢なセキュリティと高速な同期を両立しています。
   
2. **SPA化とエッジレンダリング**
   以前の `EJS` テンプレートエンジンによるサーバーサイドレンダリングから、完全な静的HTML (`public/`) とフロントエンドJavaScriptの構成に移行しました。これにより、CloudflareのエッジネットワークからHTMLが超高速で配信される恩恵を最大限に受けています。

3. **強固な合言葉システム**
   グループの「合言葉」検証はバックエンドで行い、ブラウザには安全な Cookie (`path=/`, `HttpOnly`, `Secure`, `SameSite=Lax`) のみを発行します。これにより、クライアント側の改ざんやログアウト漏れによる不正な直接URLアクセス（バイパス）を完全に遮断しています。
