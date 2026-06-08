'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';

function LoginForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(t('login.error'));
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div
            className="w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_0_40px_rgba(34,197,94,0.3)]"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
          >
            💪
          </div>
          <h1
            className="text-4xl font-black leading-tight"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #4ade80)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('login.title')}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-medium">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-muted-foreground/70">
              {t('login.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              dir="ltr"
              className="w-full bg-[#111111] border border-white/[0.08] rounded-[16px] px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-muted-foreground/40"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-muted-foreground/70">
              {t('login.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              dir="ltr"
              className="w-full bg-[#111111] border border-white/[0.08] rounded-[16px] px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-[14px] px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-[18px] font-black text-[15px] tracking-wide text-black transition-all hover:opacity-90 disabled:opacity-50 active:scale-[0.98] mt-2"
            style={{
              background: loading ? '#1a3a1a' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(34,197,94,0.4)',
            }}
          >
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
