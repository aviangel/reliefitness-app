import { MealLogForm } from '@/components/health/MealLogForm';
import { ScrollShell } from '@/components/health/ScrollShell';
import { getT } from '@/lib/i18n/server';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function MealLogPage({
  searchParams,
}: {
  searchParams: { meal_type?: string };
}) {
  const t = getT();
  return (
    <ScrollShell>
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <Link
          href="/meals"
          className="w-9 h-9 flex items-center justify-center -ms-1 rounded-xl bg-surface-2 hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[18px] font-black">{t('meals.logTitle')}</h1>
      </div>
      <MealLogForm defaultMealType={searchParams.meal_type} />
    </ScrollShell>
  );
}
