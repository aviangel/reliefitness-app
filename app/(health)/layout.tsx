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
      className="flex flex-col overflow-hidden bg-[#0a0a0a]"
      style={{ maxWidth: 480, margin: '0 auto', height: '100dvh' }}
    >
      <main
        className="flex-1 overflow-y-auto pb-24"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {children}
      </main>
      <SlipLogDialog />
      <BottomNav />
    </div>
  );
}
