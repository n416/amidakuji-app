import { sign } from 'hono/jwt';

export async function generateR2UploadUrl(
  env: { JWT_SECRET?: string },
  fileName: string,
  mimeType: string,
  expiresInSeconds: number = 180
): Promise<string> {
  if (!env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    throw new Error('JWT_SECRET is not configured');
  }

  const tokenPayload = {
    fileName,
    fileType: mimeType,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };

  const uploadToken = await sign(tokenPayload, env.JWT_SECRET, 'HS256');
  return `/api/uploads?token=${uploadToken}`;
}
