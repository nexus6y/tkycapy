import { createHmac, timingSafeEqual } from 'crypto';

type AuthPayload = {
  sub: string;
  username: string;
  exp?: number;
};

const TOKEN_TTL_SECONDS = 604800;

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

function getSecret() {
  return process.env.JWT_SECRET || 'change-me';
}

export function signAuthToken(payload: Pick<AuthPayload, 'sub' | 'username'>) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body: AuthPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = base64Url(createHmac('sha256', getSecret()).update(data).digest());
  return `${data}.${signature}`;
}

export function verifyAuthToken(token: string): AuthPayload {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) throw new Error('Invalid token');

  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = base64Url(createHmac('sha256', getSecret()).update(data).digest());
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AuthPayload;
  if (!payload.sub || !payload.username) throw new Error('Invalid token payload');
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}
