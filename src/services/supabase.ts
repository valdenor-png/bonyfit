import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { secureStorage } from '../lib/secureStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const appCheckSecret = process.env.EXPO_PUBLIC_APP_CHECK_SECRET ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY devem estar definidos no .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: appCheckSecret
      ? { 'X-App-Token': appCheckSecret }
      : {},
  },
});
