'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const inputClass =
    'w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white/90 placeholder-white/20 font-light tracking-wide focus:outline-none focus:border-white/30 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <input
          type="text"
          placeholder="姓名"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="email"
          placeholder="邮箱"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <input
        type="text"
        placeholder="主题"
        value={form.subject}
        onChange={(e) => update('subject', e.target.value)}
        className={inputClass}
        required
      />

      <textarea
        placeholder="留言内容"
        value={form.message}
        onChange={(e) => update('message', e.target.value)}
        rows={6}
        className={`${inputClass} resize-none`}
        required
      />

      <div className="flex items-center gap-6">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="px-10 py-3 border border-white/20 text-[10px] tracking-[0.3em] uppercase text-white/60 hover:bg-white hover:text-black hover:border-white transition-all duration-500 disabled:opacity-40"
        >
          {status === 'sending' ? '发送中…' : '发送消息'}
        </button>

        {status === 'sent' && (
          <span className="text-xs text-white/40 tracking-wide">✓ 消息已发送</span>
        )}
        {status === 'error' && (
          <span className="text-xs text-red-400/60 tracking-wide">发送失败，请重试</span>
        )}
      </div>
    </form>
  );
}
