import { NextRequest, NextResponse } from 'next/server';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  const token = await signToken();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}
