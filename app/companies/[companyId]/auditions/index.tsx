// app/companies/[companyId]/auditions/index.tsx
import React, { useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Snackbar from "@/components/Snackbar";
import AuditionCard from "@/components/auditions/AuditionCard";
import { AuditionFilter } from "@/types/audition";
import { useCompanyMinimal } from "@/hooks/useCompany";
import { useCompanyAuditions } from "@/hooks/useCompanyAuditions";
import { useAuditionDeleteHandlers } from "@/hooks/useAuditionDeleteHandlers";

export default function CompanyAuditionsListScreen() {
  const router = useRouter();
  const { companyId } = useLocalSearchParams<{ companyId: string }>();

  const { company, loading: loadingCompany, errorMsg: companyErr } = useCompanyMinimal(companyId);
  const {
    filter, setFilter, auditions, heightsMap,
    loading: loadingAuditions, errorMsg, refresh,
  } = useCompanyAuditions(companyId, "upcoming");

  const isLoading = loadingCompany || loadingAuditions;

  // Snackbar state (según tu patrón)
  const [snackbar, setSnackbar] = useState<{
    message: string;
    color?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
  } | null>(null);

  // Handlers de borrado -> muestran snackbar y refrescan lista
  const { onDeleted, onDeleteError } = useAuditionDeleteHandlers(setSnackbar, {
    refresh,
    successMessage: "Audición eliminada correctamente",
  });

  if (isLoading) {
    return <Text style={{ padding: 16 }}>Cargando…</Text>; // o tu skeleton
  }

  if (companyErr) {
    return <Text style={{ padding: 16, color: 'crimson' }}>{companyErr}</Text>;
  }

  function goCreate() {
    router.push(`/companies/${companyId}/auditions/create` as const);
  }

  function onEdit(a: { id: string }) {
    router.push(`/companies/${companyId}/auditions/${a.id}/edit` as const);
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        maxWidth: 1200,
        alignContent: "center",
        alignSelf: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
        Auditions for {company?.name}
      </Text>

      {/* Filtros */}
      <View
        style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        {(["upcoming", "deadline_open", "past", "all"] as AuditionFilter[]).map(
          (f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: filter === f ? "#111" : "#bbb",
                opacity: filter === f ? 1 : 0.7,
              }}
            >
              <Text>
                {f === "upcoming"
                  ? "Próximas"
                  : f === "deadline_open"
                    ? "Plazo abierto"
                    : f === "past"
                      ? "Pasadas"
                      : "Todas"}
              </Text>
            </Pressable>
          )
        )}
      </View>

      {errorMsg ? (
        <Text style={{ color: "crimson", marginBottom: 8 }}>{errorMsg}</Text>
      ) : null}

      <FlatList
        data={auditions}
        keyExtractor={(a) => a.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        renderItem={({ item }) => (
          <AuditionCard
            audition={item}
            heights={heightsMap[item.id]}
            isCurrent={
              company?.current_audition_id
                ? company.current_audition_id === item.id
                : false
            }
            onEdit={onEdit}
            onDeleted={onDeleted}
            onDeleteError={onDeleteError}
          />
        )}
        ListEmptyComponent={
          <Text style={{ opacity: 0.7, marginTop: 12 }}>
            No hay audiciones para esta compañía.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* FAB */}
      <Pressable
        onPress={goCreate}
        accessibilityRole="button"
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 24,
          borderWidth: 1,
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Text style={{ fontWeight: "700" }}>+ Nueva audición</Text>
      </Pressable>

      {/* Snackbar */}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          iconName={snackbar.iconName}
          duration={3000}
          onClose={() => setSnackbar(null)}
        />
      )}
    </View>
  );
}
