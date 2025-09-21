// utils/cleanup.ts
import { supabase } from '@/services/supabase';

export async function hardCleanup() {
  try {
    // Cierra TODOS los canales Realtime vivos
    supabase.removeAllChannels();
  } catch {}
  // Aquí limpia caches propias (React Query, Zustand, etc.)
  // queryClient.clear(); // si usas TanStack Query
}
