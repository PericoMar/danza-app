// app/admin/resources.tsx
// La cola de revisión: lo que los profesionales nos han mandado y lo que ya
// está publicado.
//
// Publicar es nuestro a propósito (ver docs/adr/0002): el valor del directorio
// es que está curado. La base de datos ya lo garantiza — `resources_guard`
// deja `published` y `verified` solo a un admin — así que esta pantalla es
// solo la forma cómoda de hacerlo.
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import RequireAdmin from '@/components/common/RequireAdmin';
import SiteHeader from '@/components/common/SiteHeader';
import { AccountButton, accountStyles } from '@/components/account';
import ResourceCard from '@/components/resources/ResourceCard';
import {
  fetchResourcesByStatus,
  setResourceStatus,
  setResourceVerified,
} from '@/services/resources';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER, MONO_LABEL, loadCompaniesFonts, pageHPadding } from '@/theme/companies';
import { PROFILE_CONTENT_MAX_WIDTH } from '@/constants/layout';
import { resourcePath } from '@/constants/routes';
import { Resource, ResourceStatus } from '@/types/resource';
import { fieldCopy } from '@/utils/resourceOnboarding';

export default function AdminResourcesScreen() {
  return (
    <RequireAdmin>
      <AdminResources />
    </RequireAdmin>
  );
}

function AdminResources() {
  loadCompaniesFonts();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [pending, setPending] = useState<Resource[]>([]);
  const [published, setPublished] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRows, publishedRows] = await Promise.all([
        fetchResourcesByStatus(ResourceStatus.PENDING_REVIEW),
        fetchResourcesByStatus(ResourceStatus.PUBLISHED),
      ]);
      setPending(pendingRows);
      setPublished(publishedRows);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load the queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (resourceId: string, write: () => Promise<void>) => {
    setBusyId(resourceId);
    setError(null);
    try {
      await write();
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'That did not go through.');
    } finally {
      setBusyId(null);
    }
  };

  const renderRow = (resource: Resource, queue: boolean) => (
    <View key={resource.id} style={styles.item}>
      <ResourceCard resource={resource} onPress={() => router.push(resourcePath(resource.slug))} />

      {resource.skipped_fields.length > 0 ? (
        <Text style={accountStyles.hintText}>
          Left for later: {resource.skipped_fields.map((f) => fieldCopy(resource.type, f).label).join(', ')}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {queue ? (
          <>
            <AccountButton
              label="Publish"
              onPress={() => act(resource.id, () => setResourceStatus(resource.id, ResourceStatus.PUBLISHED))}
              loading={busyId === resource.id}
            />
            <AccountButton
              label="Back to draft"
              variant="ghost"
              onPress={() => act(resource.id, () => setResourceStatus(resource.id, ResourceStatus.DRAFT))}
            />
          </>
        ) : (
          <>
            <AccountButton
              label={resource.verified ? 'Remove verified' : 'Mark verified'}
              variant="ghost"
              onPress={() => act(resource.id, () => setResourceVerified(resource.id, !resource.verified))}
              loading={busyId === resource.id}
            />
            <AccountButton
              label="Hide"
              variant="ghost"
              onPress={() => act(resource.id, () => setResourceStatus(resource.id, ResourceStatus.HIDDEN))}
            />
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Head>
        <title>Resources queue · danza.app</title>
      </Head>
      <SiteHeader />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.page,
            { maxWidth: PROFILE_CONTENT_MAX_WIDTH, paddingHorizontal: pageHPadding(width) },
          ]}
        >
          <View>
            <Text style={styles.eyebrow}>Admin</Text>
            <Text style={styles.title}>Resources queue</Text>
          </View>

          {error ? <Text style={accountStyles.errorText}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.text} />
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Waiting for review ({pending.length})
                </Text>
                {pending.length === 0 ? (
                  <Text style={accountStyles.hintText}>Nothing waiting.</Text>
                ) : (
                  pending.map((resource) => renderRow(resource, true))
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Published ({published.length})</Text>
                {published.length === 0 ? (
                  <Text style={accountStyles.hintText}>Nothing published yet.</Text>
                ) : (
                  published.map((resource) => renderRow(resource, false))
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  page: {
    width: '100%',
    paddingTop: 36,
    paddingBottom: 56,
    gap: 28,
  },
  eyebrow: {
    fontFamily: MONO_LABEL,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.9,
    textTransform: 'uppercase',
    color: Colors.grey2,
  },
  title: {
    fontFamily: DISPLAY,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.text,
  },
  section: {
    gap: 14,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  sectionTitle: {
    fontFamily: INTER,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  item: {
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});
