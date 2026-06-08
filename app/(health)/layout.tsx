import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/health/BottomNav';
import { SlipLogDialog } from '@/components/health/SlipLogDialog';

export default async function HealthLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div
      className="flex flex-col overflow-hidden bg-background"
      style={{ maxWidth: 480, margin: '0 auto', height: '100dvh' }}
    >
      {/* Positioning context — each page owns a full-size scroll box inside */}
      <main className="flex-1 min-h-0 relative overflow-hidden">
        {children}
      </main>
      <SlipLogDialog />
      <BottomNav />
    </div>
  );
}
