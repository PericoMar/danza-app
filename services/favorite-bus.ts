// services/favorites-bus.ts
type Handler = (payload: { companyId: string; isFavorite: boolean }) => void;
const listeners = new Set<Handler>();

export const FavoritesBus = {
  on(handler: Handler) { listeners.add(handler); return () => listeners.delete(handler); },
  emit(payload: { companyId: string; isFavorite: boolean }) {
    listeners.forEach((h) => h(payload));
  },
};
