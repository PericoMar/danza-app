import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import RequireAdmin from '@/components/common/RequireAdmin';
import SiteHeader from '@/components/common/SiteHeader';
import FilterTag from '@/components/FilterTag';
import StatTile from '@/components/admin/StatTile';
import TimeSeriesChart from '@/components/admin/TimeSeriesChart';
import { useUserRegistrationStats } from '@/hooks/useUserRegistrationStats';
import { RegistrationGranularity } from '@/types/adminStats';
import { REGISTRATION_GRANULARITY_LABELS, REGISTRATION_GRANULARITY_OPTIONS } from '@/constants/adminStats';
import { Colors } from '@/theme/colors';
import { INTER, pageHPadding, pageMaxWidth } from '@/theme/companies';

export default function UserStatsScreen() {
  const [granularity, setGranularity] = useState<RegistrationGranularity>(RegistrationGranularity.DAY);
  const { stats, isLoading, error } = useUserRegistrationStats(granularity);
  const { width } = useWindowDimensions();

  const contentWidth = pageMaxWidth(width);
  const hPadding = pageHPadding(width);

  return (
    <RequireAdmin>
      <SiteHeader />
      <ScrollView style={styles.wrapper} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={[styles.content, { maxWidth: contentWidth, paddingHorizontal: hPadding }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>Admin</Text>
              <Text style={styles.title}>User registrations</Text>
            </View>

            <View style={styles.toggleRow}>
              {REGISTRATION_GRANULARITY_OPTIONS.map((option) => (
                <FilterTag
                  key={option}
                  label={REGISTRATION_GRANULARITY_LABELS[option]}
                  active={granularity === option}
                  onPress={() => setGranularity(option)}
                  compact
                />
              ))}
            </View>
          </View>

          {error ? (
            <Text style={styles.error}>Failed to load registration stats.</Text>
          ) : isLoading || !stats ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <>
              <View style={styles.tilesRow}>
                <StatTile label="Total users" value={stats.totalUsers.toLocaleString()} />
                <StatTile label="New — last 7 days" value={stats.last7Days.toLocaleString()} />
                <StatTile
                  label="New — last 30 days"
                  value={stats.last30Days.toLocaleString()}
                  delta={
                    stats.growthPct === null
                      ? null
                      : {
                          text: `${stats.growthPct >= 0 ? '+' : ''}${stats.growthPct.toFixed(1)}% vs prev. 30 days`,
                          positive: stats.growthPct >= 0,
                        }
                  }
                />
              </View>

              <View style={styles.chartsCol}>
                <TimeSeriesChart
                  title={`New registrations per ${REGISTRATION_GRANULARITY_LABELS[granularity].toLowerCase()}`}
                  buckets={stats.buckets}
                  valueKey="count"
                  variant="bar"
                  color={Colors.purple}
                />
                <TimeSeriesChart
                  title="Cumulative users"
                  buckets={stats.buckets}
                  valueKey="cumulative"
                  variant="line"
                  color={Colors.text}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </RequireAdmin>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    width: '100%',
    paddingTop: 32,
    paddingBottom: 60,
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 16,
  },
  eyebrow: {
    fontFamily: INTER,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.grey2,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  title: {
    fontFamily: INTER,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  chartsCol: {
    gap: 18,
  },
  error: {
    fontFamily: INTER,
    color: '#d32f2f',
    fontWeight: '600',
    marginTop: 24,
  },
});
