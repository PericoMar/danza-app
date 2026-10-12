// app/companies/[companyId]/auditions/index.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Snackbar from "@/components/Snackbar";
import SiteHeader from "@/components/common/SiteHeader";
import AuditionCard from "@/components/auditions/AuditionCard";
import CompanyAuditionsHeader from "@/components/auditions/CompanyAuditionsHeader";
import { useCompanyMinimal } from "@/hooks/useCompany";
import { useCompanyAuditions } from "@/hooks/useCompanyAuditions";
import { useAuditionDeleteHandlers } from "@/hooks/useAuditionDeleteHandlers";
import { getActiveAuditionsByRelevance, sortAuditionsByRelevance } from "@/utils/auditions";
import { SnackbarState } from "@/types/ui";
import { Colors } from "@/theme/colors";
import { INTER, loadCompaniesFonts, pageHPadding } from "@/theme/companies";
import { INSIGHTS_CONTENT_MAX_WIDTH } from "@/constants/layout";

loadCompaniesFonts();

export default function CompanyAuditionsListScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { companyId } = useLocalSearchParams<{ companyId: string }>();

  const { company, loading: loadingCompany, errorMsg: companyErr } = useCompanyMinimal(companyId);
  const {
    auditions,
    heightsMap,
    loading: loadingAuditions,
    errorMsg,
    refresh,
  } = useCompanyAuditions(companyId);

  // Same order as the public company page; "Featured" is the active audition
  // dancers see on top of the stack there.
  const sortedAuditions = useMemo(() => sortAuditionsByRelevance(auditions), [auditions]);
  const featuredId = useMemo(
    () => getActiveAuditionsByRelevance({ auditions })[0]?.id,
    [auditions],
  );

  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const { onDeleted, onDeleteError } = useAuditionDeleteHandlers(setSnackbar, {
    refresh,
    successMessage: "Audition deleted",
  });

  const goBack = () =>
    router.navigate({ pathname: "/insights/[companyId]", params: { companyId } });
  const goCreate = () => router.push(`/companies/${companyId}/auditions/create` as const);
  const goEdit = (a: { id: string }) =>
    router.push(`/companies/${companyId}/auditions/${a.id}/edit` as const);

  // Only block the page on the first load; refreshes keep the list on screen.
  if ((loadingCompany && !company) || (loadingAuditions && auditions.length === 0)) {
    return (
      <PageState>
        <ActivityIndicator color={Colors.text} />
      </PageState>
    );
  }

  if (companyErr || !company) {
    return (
      <PageState>
        <Ionicons name="alert-circle-outline" size={26} color={Colors.textMuted} />
        <Text style={styles.stateTitle}>{companyErr ? "Couldn't load the company" : "Company not found"}</Text>
        {!!companyErr && <Text style={styles.stateBody}>{companyErr}</Text>}
      </PageState>
    );
  }

  return (
    <View style={styles.screen}>
      <SiteHeader />
      <FlatList
        data={sortedAuditions}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[styles.content, { paddingHorizontal: pageHPadding(width) }]}
        refreshControl={<RefreshControl refreshing={loadingAuditions} onRefresh={refresh} />}
        ListHeaderComponent={
          <>
            <CompanyAuditionsHeader
              companyName={company.name}
              auditionCount={auditions.length}
              onBack={goBack}
              onCreate={goCreate}
            />
            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.dangerText} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
          </>
        }
        ItemSeparatorComponent={ListGap}
        renderItem={({ item }) => (
          <AuditionCard
            audition={item}
            heights={heightsMap[item.id]}
            isFeatured={item.id === featuredId}
            onEdit={goEdit}
            onDeleted={onDeleted}
            onDeleteError={onDeleteError}
          />
        )}
        ListEmptyComponent={
          errorMsg ? null : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="musical-notes-outline" size={22} color={Colors.text} />
              </View>
              <Text style={styles.stateTitle}>No auditions yet</Text>
              <Text style={styles.stateBody}>
                Create one with “New audition” and it will show on {company.name}'s card and page.
              </Text>
            </View>
          )
        }
      />

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

function ListGap() {
  return <View style={styles.gap} />;
}

function PageState({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <SiteHeader />
      <View style={styles.state}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    width: "100%",
    maxWidth: INSIGHTS_CONTENT_MAX_WIDTH,
    alignSelf: "center",
    paddingBottom: 80,
  },
  gap: {
    height: 14,
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  stateTitle: {
    fontFamily: INTER,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  stateBody: {
    fontFamily: INTER,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 360,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.dangerSoft,
  },
  errorText: {
    flex: 1,
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.dangerText,
  },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.ruleStrong,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.chromeSoft,
    marginBottom: 4,
  },
});
