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
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <Link
          href="/meals"
          className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">{t('meals.logTitle')}</h1>
      </div>
      <MealLogForm defaultMealType={searchParams.meal_type} />
    </div>
  );
}
