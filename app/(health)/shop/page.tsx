import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScrollShell } from '@/components/health/ScrollShell';
import { ShopClient } from '@/components/health/ShopClient';
import { getT } from '@/lib/i18n/server';

export const revalidate = 0;

export default async function ShopPage() {
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: items }, { data: inventory }, { data: points }, { data: state }] = await Promise.all([
    supabase.from('shop_items')
      .select('slug,item_type,pet_slug,name_en,name_he,category,cost,is_starter,image_path,emoji,sort')
      .eq('is_starter', false)
      .order('sort'),
    supabase.from('user_inventory').select('item_slug').eq('user_id', user.id),
    supabase.from('user_points').select('balance').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_pet_state').select('active_pet_slug').eq('user_id', user.id).maybeSingle(),
  ]);

  return (
    <ScrollShell>
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <h1 className="text-[20px] font-black">{t('shop.title')}</h1>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{t('shop.subtitle')}</p>
      </div>
      <ShopClient
        items={(items ?? []) as any}
        ownedSlugs={(inventory ?? []).map((r: any) => r.item_slug)}
        balance={Number((points as any)?.balance ?? 0)}
        activePetSlug={(state as any)?.active_pet_slug ?? null}
      />
    </ScrollShell>
  );
}
