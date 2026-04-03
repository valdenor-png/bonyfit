import { supabase } from './supabase';
import type { CatracaEvent } from '../types/payment';

const CATRACA_API_URL =
  process.env.EXPO_PUBLIC_CATRACA_API_URL ?? 'https://catraca.bonyfit.com/api';

const headers = {
  'Content-Type': 'application/json',
};

/**
 * Register a user's facial image with the turnstile/catraca system.
 * This sends the image to the catraca provider so it can be used
 * for facial recognition at gym entry points.
 */
export async function registerFace(
  userId: string,
  imageUri: string,
): Promise<{ success: boolean; message: string }> {
  // Upload to Supabase storage first
  const fileName = `${userId}/facial.jpg`;
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('facial')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('facial').getPublicUrl(fileName);

  // Update user record
  await supabase
    .from('users')
    .update({ facial_url: publicUrl })
    .eq('id', userId);

  // Register with catraca provider
  const catracaResponse = await fetch(`${CATRACA_API_URL}/faces`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      external_id: userId,
      image_url: publicUrl,
    }),
  });

  if (!catracaResponse.ok) {
    const err = await catracaResponse.json().catch(() => ({}));
    throw new Error(
      (err as any).message ?? 'Erro ao registrar face na catraca',
    );
  }

  return { success: true, message: 'Face registrada com sucesso' };
}

/**
 * Check if a user has an entry event for a given date.
 * Used to verify gym attendance and validate check-in points.
 */
export async function checkEntry(
  userId: string,
  date: string,
): Promise<CatracaEvent | null> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('catraca_events')
    .select('*')
    .eq('user_id', userId)
    .eq('direction', 'in')
    .gte('timestamp', startOfDay)
    .lte('timestamp', endOfDay)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as CatracaEvent) ?? null;
}

/**
 * Handle an incoming webhook from the catraca system.
 * This is called when the turnstile detects a facial recognition event
 * (entry or exit). It records the event and, on entry, validates
 * any active workout session.
 */
export async function onEntryWebhook(payload: {
  external_id: string;
  unit_id: string;
  direction: 'in' | 'out';
  timestamp: string;
}): Promise<CatracaEvent> {
  const { external_id: userId, unit_id, direction, timestamp } = payload;

  // Record the event
  const { data: event, error } = await supabase
    .from('catraca_events')
    .insert({
      user_id: userId,
      unit_id,
      direction,
      timestamp,
    })
    .select()
    .single();

  if (error) throw error;

  // On entry, mark any active workout session as catraca-validated
  if (direction === 'in') {
    await supabase
      .from('workout_sessions')
      .update({ catraca_validated: true })
      .eq('user_id', userId)
      .is('ended_at', null);

    // Update unit occupancy count
    await supabase.rpc('increment_unit_count', {
      p_unit_id: unit_id,
      p_delta: 1,
    });
  }

  if (direction === 'out') {
    await supabase.rpc('increment_unit_count', {
      p_unit_id: unit_id,
      p_delta: -1,
    });
  }

  return event as CatracaEvent;
}
