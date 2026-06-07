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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">💪</div>
          <h1 className="text-3xl font-bold text-gradient">{t('login.title')}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              dir="ltr"
              className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              dir="ltr"
              className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.98]"
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
