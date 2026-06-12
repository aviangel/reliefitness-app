import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScrollShell } from '@/components/health/ScrollShell';
import { PetClient } from '@/components/health/PetClient';
import { PetOnboarding } from '@/components/health/PetOnboarding';
import { getT } from '@/lib/i18n/server';
import { getWeeklyDeficitStatus } from '@/lib/health/rewards-actions';

export const revalidate = 0;

export default async function PetPage() {
  const t = getT();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: state } = await supabase
    .from('user_pet_state')
    .select('active_pet_slug,pet_name,variant,equipped_items')
    .eq('user_id', user.id)
    .maybeSingle();

  // First visit — adopt a starter
  if (!state) {
    const { data: starters } = await supabase
      .from('shop_items')
      .select('slug,name_en,name_he,category,image_path,emoji')
      .eq('item_type', 'pet').eq('is_starter', true).order('sort');
    return (
      <ScrollShell>
        <div className="px-4 pt-6 pb-4 border-b border-border">
          <h1 className="text-[20px] font-black">{t('pet.adoptTitle')}</h1>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{t('pet.adoptSubtitle')}</p>
        </div>
        <PetOnboarding starters={(starters ?? []) as any} />
      </ScrollShell>
    );
  }

  const s = state as any;
  const [{ data: points }, { data: inventory }, { data: items }, weekly] = await Promise.all([
    supabase.from('user_points').select('balance,lifetime,deficit_week_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_inventory').select('item_slug').eq('user_id', user.id),
    supabase.from('shop_items').select('slug,item_type,pet_slug,name_en,name_he,image_path,emoji,cost'),
    getWeeklyDeficitStatus(),
  ]);

  const ownedSlugs = new Set((inventory ?? []).map((r: any) => r.item_slug));
  const all = (items ?? []) as any[];
  const ownedPets = all.filter((i) => i.item_type === 'pet' && ownedSlugs.has(i.slug));
  const ownedAccessories = all.filter(
    (i) => i.item_type === 'accessory' && ownedSlugs.has(i.slug) && i.pet_slug === s.active_pet_slug
  );
  const activePet = all.find((i) => i.slug === s.active_pet_slug) ?? null;

  return (
    <ScrollShell>
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <h1 className="text-[20px] font-black">{t('pet.title')}</h1>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{t('pet.subtitle')}</p>
      </div>
      <PetClient
        petName={s.pet_name}
        variant={s.variant}
        equipped={s.equipped_items ?? []}
        activePet={activePet}
        ownedPets={ownedPets}
        ownedAccessories={ownedAccessories}
        balance={Number(points?.balance ?? 0)}
        lifetime={Number(points?.lifetime ?? 0)}
        streak={Number(points?.deficit_week_streak ?? 0)}
        weekly={weekly}
      />
    </ScrollShell>
  );
}
