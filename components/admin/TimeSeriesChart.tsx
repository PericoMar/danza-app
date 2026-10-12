import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, Platform } from 'react-native';
import Svg, { Line, Rect, Circle, Polyline } from 'react-native-svg';
import { Colors } from '@/theme/colors';
import { INTER } from '@/theme/companies';
import { RegistrationBucket } from '@/types/adminStats';

interface TimeSeriesChartProps {
  title: string;
  buckets: RegistrationBucket[];
  /** Which field of each bucket to plot. */
  valueKey: 'count' | 'cumulative';
  variant: 'bar' | 'line';
  /** Accent color for the mark — text/labels always stay on text tokens. */
  color: string;
  height?: number;
}

const CHART_HEIGHT_DEFAULT = 220;
const PADDING = { top: 16, right: 12, bottom: 28, left: 40 };
const GRID_LINES = 4;

export default function TimeSeriesChart({
  title,
  buckets,
  valueKey,
  variant,
  color,
  height = CHART_HEIGHT_DEFAULT,
}: TimeSeriesChartProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const values = buckets.map((b) => b[valueKey]);
  const maxValue = Math.max(1, ...values);

  const plotWidth = Math.max(0, width - PADDING.left - PADDING.right);
  const plotHeight = height - PADDING.top - PADDING.bottom;
  const step = buckets.length > 1 ? plotWidth / (buckets.length - 1 || 1) : plotWidth;
  const barWidth = buckets.length > 0 ? Math.max(2, Math.min(18, (plotWidth / buckets.length) * 0.6)) : 0;

  const xFor = (i: number) =>
    PADDING.left + (buckets.length > 1 ? i * step : plotWidth / 2);
  const yFor = (v: number) => PADDING.top + plotHeight - (v / maxValue) * plotHeight;

  // Show at most ~6 x-axis labels so they never overlap on narrow screens.
  const labelStep = Math.max(1, Math.ceil(buckets.length / 6));

  const active = activeIndex !== null ? buckets[activeIndex] : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {active && (
          <Text style={styles.tooltipInline}>
            {active.label} · <Text style={{ color }}>{active[valueKey]}</Text>
          </Text>
        )}
      </View>

      <View onLayout={onLayout} style={{ height }}>
        {width > 0 && buckets.length > 0 ? (
          <>
          <Svg width={width} height={height}>
            {Array.from({ length: GRID_LINES }).map((_, i) => {
              const y = PADDING.top + (plotHeight / (GRID_LINES - 1)) * i;
              return (
                <Line
                  key={i}
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke={Colors.rule}
                  strokeWidth={1}
                />
              );
            })}

            {variant === 'bar' &&
              buckets.map((b, i) => {
                const x = xFor(i) - barWidth / 2;
                const y = yFor(b[valueKey]);
                const isActive = activeIndex === i;
                return (
                  <Rect
                    key={i}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(0, PADDING.top + plotHeight - y)}
                    rx={2}
                    fill={isActive ? color : color}
                    opacity={activeIndex === null || isActive ? 1 : 0.45}
                  />
                );
              })}

            {variant === 'line' && (
              <Polyline
                points={buckets.map((b, i) => `${xFor(i)},${yFor(b[valueKey])}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {variant === 'line' && activeIndex !== null && (
              <>
                <Line
                  x1={xFor(activeIndex)}
                  x2={xFor(activeIndex)}
                  y1={PADDING.top}
                  y2={PADDING.top + plotHeight}
                  stroke={Colors.ruleStrong}
                  strokeWidth={1}
                />
                <Circle cx={xFor(activeIndex)} cy={yFor(buckets[activeIndex][valueKey])} r={4} fill={color} />
              </>
            )}
          </Svg>

          {/* Invisible touch/hover targets — one per bucket, sized well past the mark itself. */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {buckets.map((_, i) => {
              const targetWidth = Math.max(barWidth, step || plotWidth);
              return (
                <Pressable
                  key={i}
                  onHoverIn={Platform.OS === 'web' ? () => setActiveIndex(i) : undefined}
                  onHoverOut={Platform.OS === 'web' ? () => setActiveIndex(null) : undefined}
                  onPressIn={() => setActiveIndex(i)}
                  onPressOut={() => setActiveIndex(null)}
                  style={{
                    position: 'absolute',
                    left: xFor(i) - targetWidth / 2,
                    top: 0,
                    width: targetWidth,
                    height: PADDING.top + plotHeight,
                  }}
                />
              );
            })}
          </View>

          <View style={[styles.xLabels, { paddingLeft: PADDING.left, paddingRight: PADDING.right }]}>
            {buckets.map((b, i) =>
              i % labelStep === 0 ? (
                <Text key={i} style={[styles.xLabel, { position: 'absolute', left: xFor(i) - PADDING.left - 20, width: 40 }]}>
                  {b.label}
                </Text>
              ) : null
            )}
          </View>
          </>
        ) : buckets.length === 0 ? (
          <View style={[styles.empty, { height }]}>
            <Text style={styles.emptyText}>No data yet</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    padding: 18,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: INTER,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tooltipInline: {
    fontFamily: INTER,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  xLabels: {
    height: 18,
  },
  xLabel: {
    fontFamily: INTER,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
