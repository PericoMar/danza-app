import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // PKCE gives us a plain `?code=...` query param on the deep link
      // (myapp://...), which survives being passed through the OS's
      // URL handling. The implicit flow's #access_token fragment does not
      // reliably survive that round trip on native.
      flowType: 'pkce',
    },
    realtime: { params: { eventsPerSecond: 10 } },
  }
);
