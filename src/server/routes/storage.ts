import { Hono } from 'hono';
import { verify } from 'hono/jwt';

const storageRouter = new Hono<{ Bindings: any; Variables: any }>();

storageRouter.put('/uploads', async (c) => {
  try {
    const token = c.req.query('token');
    if (!token) return c.json({ error: 'Missing upload token' }, 401);

    if (!c.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return c.json({ error: 'Server configuration error' }, 500);
    }

    // Verify token
    let payload;
    try {
      payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    } catch (err) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    const contentLength = Number(c.req.header('content-length') || 0);
    // 10MB limit enforcement at the application level
    if (contentLength > 10 * 1024 * 1024) {
      return c.json({ error: 'Payload Too Large' }, 413);
    }

    const { fileName, fileType } = payload as any;
    if (!fileName || !fileType) return c.json({ error: 'Invalid token payload' }, 400);

    // Get the array buffer instead of raw body stream to prevent local Miniflare issues
    const body = await c.req.arrayBuffer();
    if (!body || body.byteLength === 0) return c.json({ error: 'Empty body' }, 400);

    if (!c.env.BUCKET) {
      console.error('R2 BUCKET binding is undefined. Check wrangler.toml and local dev setup.');
      return c.json({ error: 'Storage is not properly configured in this environment' }, 500);
    }

    // Put object into R2
    await c.env.BUCKET.put(fileName, body, {
      httpMetadata: {
        contentType: fileType,
      },
    });

    return c.json({ message: 'Upload successful' }, 200);
  } catch (err) {
    console.error('R2 upload error:', err);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

storageRouter.get('/public-images/*', async (c) => {
  try {
    if (!c.env.BUCKET) {
      return c.text('R2 binding missing', 500);
    }

    let fileName = c.req.path.replace(/^\/api\/public-images\//, '');
    fileName = decodeURIComponent(fileName);
    
    const object = await c.env.BUCKET.get(fileName);
    if (!object) {
      return c.text('Image not found', 404);
    }

    const headers = new Headers();
    if (object.httpMetadata && object.httpMetadata.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType);
    }
    if (object.httpEtag) {
      headers.set('etag', object.httpEtag);
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, {
      headers,
    });
  } catch (err) {
    console.error('R2 get error:', err);
    return c.text('Failed to fetch image', 500);
  }
});

export default storageRouter;
