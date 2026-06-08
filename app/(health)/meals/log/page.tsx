import { MealLogForm } from '@/components/health/MealLogForm';
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
    <div>
      <div className="flex items-center gap-2 px-4 py-4 border-b border-white/[0.06]">
        <Link
          href="/meals"
          className="w-9 h-9 flex items-center justify-center -ms-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[18px] font-black">{t('meals.logTitle')}</h1>
      </div>
      <MealLogForm defaultMealType={searchParams.meal_type} />
    </div>
  );
}
