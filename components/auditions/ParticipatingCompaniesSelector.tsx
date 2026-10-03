// components/auditions/ParticipatingCompaniesSelector.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { searchCompaniesByName } from "@/services/auditions";
import type { ParticipatingCompanySummary } from "@/types/audition";

const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  value: ParticipatingCompanySummary[];
  onChange: (next: ParticipatingCompanySummary[]) => void;
  excludeCompanyId: string;
};

export default function ParticipatingCompaniesSelector({ value, onChange, excludeCompanyId }: Props) {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<ParticipatingCompanySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchCompaniesByName(searchText, excludeCompanyId);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText, excludeCompanyId]);

  const selectedIds = new Set(value.map((c) => c.id));
  const visibleResults = results.filter((c) => !selectedIds.has(c.id));

  function addCompany(company: ParticipatingCompanySummary) {
    onChange([...value, company]);
    setSearchText("");
  }

  function removeCompany(companyId: string) {
    onChange(value.filter((c) => c.id !== companyId));
  }

  return (
    <View>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search companies by name…"
          placeholderTextColor="#6b7280"
          accessibilityLabel="Search participating companies"
        />
        {loading && <ActivityIndicator style={styles.spinner} size="small" />}
      </View>

      {searchText.trim().length > 0 && (
        <View style={styles.dropdown}>
          {visibleResults.length === 0 && !loading ? (
            <Text style={styles.emptyText}>No companies found.</Text>
          ) : (
            visibleResults.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => addCompany(c)}
                style={styles.resultRow}
                accessibilityRole="button"
                accessibilityLabel={`Add ${c.name}`}
              >
                <Text style={styles.resultText}>{c.name}</Text>
                <Text style={styles.resultAdd}>+ Add</Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      {value.length > 0 && (
        <View style={styles.chips}>
          {value.map((c) => (
            <View key={c.id} style={styles.chip}>
              <Text style={styles.chipText}>{c.name}</Text>
              <Pressable
                onPress={() => removeCompany(c.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${c.name}`}
              >
                <Text style={styles.chipRemove}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: { position: "relative", justifyContent: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#e1e4e8",
    borderRadius: 7,
    padding: 10,
    backgroundColor: "#f6f8fa",
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
  },
  spinner: { position: "absolute", right: 12 },
  dropdown: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e1e4e8",
    borderRadius: 7,
    backgroundColor: "#fff",
    maxHeight: 220,
    overflow: "hidden",
  },
  emptyText: { padding: 10, fontSize: 13, color: "#6b7280" },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f1f3",
  },
  resultText: { fontSize: 14, color: "#111827", fontWeight: "500" },
  resultAdd: { fontSize: 12, color: "#2563eb", fontWeight: "700" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  chipText: { fontSize: 13, color: "#fff", fontWeight: "600" },
  chipRemove: { fontSize: 15, color: "#fff", fontWeight: "700", lineHeight: 15 },
});
