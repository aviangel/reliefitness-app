import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/health/BottomNav';
import { SlipLogDialog } from '@/components/health/SlipLogDialog';

export default async function HealthLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <SlipLogDialog />
      <BottomNav />
    </div>
  );
}
