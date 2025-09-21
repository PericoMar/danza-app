// providers/RoleProvider.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RoleContextType = { isAdmin: boolean; loading: boolean };
const RoleContext = createContext<RoleContextType>({ isAdmin: false, loading: true });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Guardamos el canal para cerrarlo al desmontar
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Para ignorar respuestas tardías si cambia de usuario a mitad
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);

      // 1) Sesión actual (más fiable que getUser para hidratar el 2º login)
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      uidRef.current = uid;

      // 2) Si no hay usuario: limpia y sal
      if (!uid) {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      // 3) Cierra canal previo por si venimos de otro usuario
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // 4) Pregunta a la BD (RPC recomendado porque respeta RLS/JWT)
      try {
        const { data: rpcValue, error } = await supabase.rpc("is_admin");

        if (cancelled || uidRef.current !== uid) return;

        if (error) {
          console.warn("is_admin rpc failed:", error.message);

          // Fallback opcional (si tus políticas RLS lo permiten)
          const { data: row, error: err2 } = await supabase
            .from("users")
            .select("role")
            .eq("user_id", uid)
            .maybeSingle();

          if (err2) console.warn("users fallback error:", err2.message);
          setIsAdmin(row?.role === "admin");
        } else {
          setIsAdmin(Boolean(rpcValue));
        }
      } catch (e: any) {
        if (!cancelled && uidRef.current === uid) {
          console.warn("role fetch error:", e?.message);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled && uidRef.current === uid) {
          setLoading(false);
        }
      }

      // 5) Suscripción a cambios de rol del propio usuario (opcional)
      const ch = supabase
        .channel(`user-role-${uid}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "users", filter: `user_id=eq.${uid}` },
          (payload) => {
            if (cancelled || uidRef.current !== uid) return;
            const newRole = (payload.new as any)?.role;
            if (typeof newRole === "string") setIsAdmin(newRole === "admin");
          }
        )
        .subscribe();
      channelRef.current = ch;
    }

    // Arranque: como el padre monta el provider con key={sessionKey}, este efecto
    // se ejecuta en cada login/logout sin necesidad de onAuthStateChange aquí.
    boot();

    // Limpieza al desmontar o cambiar de usuario (por remount)
    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // <- SIN deps: confíamos en el remount por key={sessionKey}

  return (
    <RoleContext.Provider value={{ isAdmin, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
