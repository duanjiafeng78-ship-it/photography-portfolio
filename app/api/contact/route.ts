import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    }

    // MVP: Log the message server-side
    // In production, integrate with email service (Resend, SendGrid, etc.)
    console.log('Contact form submission:', { name, email, subject, message });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
