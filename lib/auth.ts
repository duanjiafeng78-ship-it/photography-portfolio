import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = '__session';
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export { COOKIE_NAME };

export async function signToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}
