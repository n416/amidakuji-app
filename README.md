# ダイナミックあみだくじ (amidakuji-app)

リアルタイムでアニメーションが同期する、複数人参加型の動的あみだくじアプリケーションです。参加者がそれぞれ自分の画面からくじの「線（ハシゴ）」を引くことができ、誰かが線を引くたびに全員の画面にリアルタイムで反映されます。

## システム構成・技術スタック

本アプリケーションは大規模なリニューアルを経て、レガシーなVanilla JS/EJS構成から、ReactベースのモダンなSPAおよびエッジコンピューティング環境へ完全移行しました。

- **フロントエンド（UI / 状態管理）**: React 19, TypeScript, Vite, Redux Toolkit, React Router
- **スタイリング**: Vanilla SCSS (`lucide-react` アイコン併用)
- **バックエンドAPI**: Cloudflare Workers + Hono (Hono Vite Dev Server 対応)
- **リアルタイム同期**: Firebase Firestore (フロントエンドから `onSnapshot` による直接リッスン)
- **認証機構**: 
  - **Google OAuth連携**: Honoによる独自実装で、バックエンド側でJWTセッション管理。
  - **Firebase Anonymous Login**: フロントエンドからFirestoreへの安全な Read-Only リアルタイム接続用。
  - **合言葉（グループパスワード）**: サーバーサイドCookie (`verifiedGroups`) による堅牢なアクセス制御。

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
Vite 開発サーバー（Hono 統合環境）を起動します。

```bash
npm run dev
```
起動後、ブラウザから `http://localhost:5173` (Viteのデフォルトポート) 等にアクセスして動作確認を行います。
また、開発中にSCSSを自動コンパイルする場合は、別ターミナルで以下を実行します。

```bash
npm run scss
```

---

## ビルド・デプロイ方法

### 1. 本番環境（Cloudflare）へのデプロイ
TypeScriptの型チェック、Viteによるフロントエンド・バックエンド統合ビルドを行った後、Wranglerを使用して Cloudflare Workers へデプロイします。

```bash
npm run build
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
*(※ `FIREBASE_SERVICE_ACCOUNT` は複数行のJSONを含みます。改行を削除した1行のJSON文字列を使用するか、ファイルからリダイレクトして登録してください。)*

---

## 技術的な留意点・設計の工夫

1. **React / Redux / Vite によるSPA化**
   従来の画面遷移型レガシーシステムからReactによるSPAへ移行したことで、UIの応答性が飛躍的に向上しました。複雑なモーダル管理や認証状態は Redux Toolkit でグローバルに管理されています。

2. **Firestoreの権限分離 (Security Rules)**
   データの「作成・更新・削除」はすべて Cloudflare Workers のバックエンドAPI（Firebase Admin SDK経由）で行います。フロントエンドからは「閲覧のみ（`onSnapshot`）」を許可するハイブリッド設計により、堅牢なセキュリティと高速な同期を両立しています。

3. **強固な合言葉システム**
   グループの「合言葉」検証はバックエンドで行い、ブラウザには安全な Cookie (`path=/`, `HttpOnly`, `Secure`, `SameSite=Lax`) のみを発行します。これにより、クライアント側の改ざんやログアウト漏れによる不正アクセスを完全に遮断しています。
