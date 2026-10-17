// services/resourceDraft.ts
// Lo que un profesional eligió antes de tener cuenta: su tipo y su nombre.
//
// Vive en el dispositivo y no en React porque entre el paso 1 y el paso 3 del
// onboarding se crea la sesión, y una sesión nueva remonta todo el árbol de
// providers (`key={sessionKey}` en app/_layout.tsx). Si la confirmación por
// email está activada, además la app se recarga entera al volver del enlace.
// Perder aquí lo ya escrito es exactamente la baja que el onboarding evita.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_STORAGE_KEYS } from '@/constants/storage';
import { ResourceType } from '@/types/resource';

export type PendingResourceDraft = {
  type: ResourceType;
  name?: string;
};

const isResourceType = (value: unknown): value is ResourceType =>
  typeof value === 'string' && (Object.values(ResourceType) as string[]).includes(value);

export async function readPendingResourceDraft(): Promise<PendingResourceDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEYS.PENDING_RESOURCE_DRAFT);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { type, name } = parsed as { type?: unknown; name?: unknown };
    if (!isResourceType(type)) return null;

    return { type, name: typeof name === 'string' ? name : undefined };
  } catch {
    // Un valor corrupto o un storage que no responde no puede romper el alta.
    return null;
  }
}

export async function writePendingResourceDraft(draft: PendingResourceDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEYS.PENDING_RESOURCE_DRAFT, JSON.stringify(draft));
  } catch {
    // Si no se puede guardar seguimos: el usuario solo perdería estos dos campos.
  }
}

export async function clearPendingResourceDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCAL_STORAGE_KEYS.PENDING_RESOURCE_DRAFT);
  } catch {
    // Idem: borrar es una limpieza, no una operación crítica.
  }
}
