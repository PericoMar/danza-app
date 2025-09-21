// components/modals/QuotaModal.tsx
import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';

export type QuotaInfo = {
  used: number;
  remaining: number;
  limit_count: number;
  period: 'day' | 'week' | 'month';
  next_reset: string;          // ISO (timestamptz)
};

type Props = {
  visible: boolean;
  onClose: () => void;
  info: QuotaInfo | null;
  onUpgradePress?: () => void; // optional CTA
};

const PERIOD_LABEL: Record<QuotaInfo['period'], string> = {
  day: 'today',
  week: 'this week',
  month: 'this month',
};

function formatWhen(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export default function QuotaModal({ visible, onClose, info, onUpgradePress }: Props) {
  const title = 'AI Summary limit reached';
  const body1 = info
    ? `You have used ${info.used} of ${info.limit_count} ${PERIOD_LABEL[info.period]}.`
    : 'You have reached your limit.';
  const body2 = info?.next_reset
    ? `You will be able to generate a new summary on ${formatWhen(info.next_reset)}.`
    : '';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#111', padding: 20, borderRadius: 16, width: 360, gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>{title}</Text>
          <Text style={{ color: '#ddd' }}>{body1}</Text>
          {!!body2 && <Text style={{ color: '#ddd' }}>{body2}</Text>}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 }}>
            {onUpgradePress && (
              <Pressable
                onPress={onUpgradePress}
                style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#2563EB' }}
                accessibilityRole="button"
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Upgrade</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#222' }}
              accessibilityRole="button"
            >
              <Text style={{ color: 'white' }}>OK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
