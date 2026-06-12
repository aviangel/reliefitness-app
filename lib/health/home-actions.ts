'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function logQuickWater() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString().split('T')[0];
  await supabase.from('drinks_log').insert({
    user_id: user.id,
    date: today,
    type: 'water',
    amount_ml: 250,
  });
  revalidatePath('/home');
  revalidatePath('/drinks');
}
