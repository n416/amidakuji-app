import { Hono } from 'hono';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import groupsRouter from './routes/groups';
import eventsRouter from './routes/events';
import adminRouter from './routes/admin';
import membersRouter from './routes/members';
import { authMiddleware } from './middleware/auth';
import { cors } from 'hono/cors';
import { FirestoreClient } from './utils/firestore-rest';
import participantsRouter from './routes/participants';
import publicRouter from './routes/public';
import utilsRouter from './routes/utils';
import storageRouter from './routes/storage';

type Bindings = {
  FIREBASE_CONFIG: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  FIREBASE_SERVICE_ACCOUNT: string;
  GCS_BUCKET_NAME?: string;
  BUCKET: any;
  ASSETS: { fetch: typeof fetch };
};

type Variables = {
  user: any | null;
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

const ALLOWED_ORIGINS = [
  'https://amidakuji-app.tobira-sys.workers.dev',
  'http://localhost:3000',
];

app.use('*', cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-auth-token', 'x-member-id'],
  credentials: true,
}));

// ヘルスチェック
app.get('/_ah/warmup', (c) => {
  return c.text('OK');
});

app.get('/api/test', (c) => {
  const user = c.get('user');
  return c.json({ message: 'Hello from Hono!', user });
});

// ルートのマウント
app.route('/auth', authRouter);
app.route('/api', usersRouter);
app.route('/api', groupsRouter);
app.route('/api', eventsRouter);
app.route('/api', adminRouter);
app.route('/api', membersRouter);
app.route('/api', participantsRouter);
app.route('/api', publicRouter);
app.route('/api', utilsRouter);
app.route('/api', storageRouter);

// フロントエンド向け初期化設定API
app.get('/api/config', (c) => {
  try {
    const config = JSON.parse(c.env.FIREBASE_CONFIG);
    return c.json(config);
  } catch (e) {
    return c.json({}, 500);
  }
});

app.get('/api/emoji-map', (c) => {
  const emojiMap = [
    {emoji: '🏠', lucide: 'home'},
    {emoji: '👤', lucide: 'user'},
    {emoji: '▼', lucide: 'chevron-down'},
    {emoji: '❓', lucide: 'help-circle'},
  ];
  return c.json(emojiMap);
});

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#039;');
}

// SPAのフォールバックルーティング
app.get('*', async (c) => {
  const originalPath = c.req.path;
  if (originalPath.startsWith('/api/') || originalPath.startsWith('/auth/')) {
    return c.json({ error: 'Not Found' }, 404);
  }
  
  // Vite開発サーバーなど、ASSETSバインディングがない環境ではそのまま404を返す
  if (!c.env || !c.env.ASSETS) {
    return c.json({ error: 'Not Found' }, 404);
  }
  
  const url = new URL(c.req.url);
  url.pathname = '/';
  
  const req = new Request(url, c.req.raw);
  const response = await c.env.ASSETS.fetch(req);
  
  if (originalPath.startsWith('/share/')) {
    try {
      const parts = originalPath.split('/');
      const eventId = parts[2];
      const participantName = parts[3] ? decodeURIComponent(parts[3]) : '';
      
      const db = new FirestoreClient(c.env.FIREBASE_SERVICE_ACCOUNT);
      const eventDoc = await db.getDocument(`events/${eventId}`);
      
      if (eventDoc && eventDoc.name) {
        const eventData = db.firestoreToJson(eventDoc);
        const safeEventName = eventData.eventName || '無題のイベント';
        let ogTitle = `${safeEventName} の結果`;
        if (participantName) {
           ogTitle = `${participantName}さんの結果 - ${safeEventName}`;
        }
        
        const ogImageUrl = `${url.origin}/api/share/${eventId}/${encodeURIComponent(participantName)}/ogp.png`;
        const ogDesc = `ダイナミックあみだくじで結果を確認しよう！`;
        
        let html = await response.text();
        
        const safeTitle = escapeHtmlAttr(ogTitle);
        const safeDesc = escapeHtmlAttr(ogDesc);
        const safeImageUrl = escapeHtmlAttr(ogImageUrl);
        const safePageUrl = escapeHtmlAttr(c.req.url);

        const ogTags = `
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImageUrl}" />
    <meta property="og:url" content="${safePageUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImageUrl}" />`;
        
        html = html.replace('</head>', `${ogTags}\n</head>`);
        
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    } catch (e) {
      console.error('OGP injection failed:', e);
      // フォールバックとしてそのまま返す
    }
  }
  
  return response;
});

export default app;
