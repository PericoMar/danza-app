import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AccountSection, accountStyles } from '@/components/account';
import FilterTag from '@/components/FilterTag';
import StatTile from '@/components/admin/StatTile';
import TimeSeriesChart from '@/components/admin/TimeSeriesChart';
import { useUserRegistrationStats } from '@/hooks/useUserRegistrationStats';
import { RegistrationGranularity } from '@/types/adminStats';
import { REGISTRATION_GRANULARITY_LABELS, REGISTRATION_GRANULARITY_OPTIONS } from '@/constants/adminStats';
import { Colors } from '@/theme/colors';

/** The "User stats" tab of /admin/settings: sign-up totals, then the trend. */
export default function UserStatsPanel({ isWide }: { isWide: boolean }) {
  const [granularity, setGranularity] = useState<RegistrationGranularity>(RegistrationGranularity.DAY);
  const { stats, isLoading, error } = useUserRegistrationStats(granularity);

  if (error) {
    return <Text style={[accountStyles.errorText, styles.state]}>Failed to load registration stats.</Text>;
  }
  if (isLoading || !stats) {
    return <ActivityIndicator style={styles.state} />;
  }

  return (
    <View>
      <AccountSection
        index="01"
        title="Sign-ups"
        description="Everyone with an account, and how many joined lately."
        isWide={isWide}
      >
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
      </AccountSection>

      <AccountSection
        index="02"
        title="Over time"
        description="New registrations per day, week or month, and the running total."
        isWide={isWide}
      >
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
      </AccountSection>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    marginTop: 24,
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
