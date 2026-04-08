import { supabase } from './supabase';
import type { User } from '../types/user';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) throw error;
  return data as User;
}

export async function updateProfile(
  data: Partial<Pick<User, 'name' | 'phone' | 'avatar_url' | 'is_private'>>,
) {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', authUser.id);

  if (error) throw error;
}

export async function uploadFacial(userId: string, imageUri: string) {
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

  const { error: updateError } = await supabase
    .from('users')
    .update({ facial_url: publicUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return publicUrl;
}
