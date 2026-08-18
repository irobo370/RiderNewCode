import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { RADIUS, SPACING } from "../../utils/spacing";
import { ScreenHeader } from "../../components/ui";
import HomeBottomTabBar from "../../Home/Component/HomeBottomTabBar";
import DistributionDonut from "./Component/DistributionDonut";
import WeeklyTrendChart from "./Component/WeeklyTrendChart";
import { useInsights } from "../../hooks/insights/useInsights";
import type { InsightsPeriod } from "../../service/api/types";
import {
  formatComparisonText,
  formatInsightAmount,
  formatInsightDistance,
  getDistributionChartData,
  getShortRideTypeName,
  getTrendChartData,
} from "../../utils/insightsHelpers";

const PERIODS: InsightsPeriod[] = ["weekly", "monthly"];
const PERIOD_LABELS: Record<InsightsPeriod, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

const CHART_WIDTH = Dimensions.get("window").width - 72;

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function DistributionLegend({
  items,
}: {
  items: ReturnType<typeof getDistributionChartData>;
}) {
  return (
    <View style={styles.legendCol}>
      {items.map((item) => (
        <View key={item.name} style={styles.legendRow}>
          <View style={styles.legendLeft}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{getShortRideTypeName(item.name)}</Text>
          </View>
          <Text style={styles.legendPercent}>{Math.round(item.percent)}%</Text>
        </View>
      ))}
    </View>
  );
}

export default function InsightScreen() {
  const [period, setPeriod] = useState<InsightsPeriod>("weekly");
  const { data, isLoading, isError, refetch, isRefetching } = useInsights(period);

  const trendChart = useMemo(
    () => (data ? getTrendChartData(data) : null),
    [data],
  );

  const distributionItems = useMemo(
    () => (data ? getDistributionChartData(data) : []),
    [data],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <ScreenHeader title="Earning" style={styles.header} />

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : isError || !data ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>Could not load earnings</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
          >
            <View style={styles.filterTabs}>
              {PERIODS.map((tab) => {
                const isActive = period === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTab, isActive && styles.filterTabActive]}
                    onPress={() => setPeriod(tab)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        isActive && styles.filterTabTextActive,
                      ]}
                    >
                      {PERIOD_LABELS[tab]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Rides" value={String(data.rides_count)} />
              <StatCard
                label="Total Km"
                value={formatInsightDistance(data.total_km)}
              />
              <StatCard
                label="Spent"
                value={formatInsightAmount(data.total_spend, data.currency)}
              />
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>
                  {period === "weekly" ? "Weekly Trend" : "Monthly Trend"}
                </Text>
                <Text style={styles.chartComparison}>
                  {formatComparisonText(data.comparison_pct, period)}
                </Text>
              </View>

              {trendChart && trendChart.labels.length > 0 ? (
                <WeeklyTrendChart
                  labels={trendChart.labels}
                  values={trendChart.values}
                  yMax={trendChart.yAxis.yMax}
                  yTicks={trendChart.yAxis.ticks}
                  width={CHART_WIDTH}
                />
              ) : (
                <View style={styles.chartEmpty}>
                  <Text style={styles.emptyText}>No trend data yet</Text>
                </View>
              )}
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.distributionTitle}>Distribution</Text>

              {distributionItems.length > 0 ? (
                <View style={styles.distributionBody}>
                  <DistributionDonut
                    segments={distributionItems.map((item) => ({
                      percent: item.percent,
                      color: item.color,
                    }))}
                    centerValue={data.rides_count}
                  />

                  <DistributionLegend items={distributionItems} />
                </View>
              ) : (
                <View style={styles.chartEmpty}>
                  <Text style={styles.emptyText}>No ride distribution yet</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      <HomeBottomTabBar activeTab="earning" embedded />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  header: {
    marginVertical: SPACING.md,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
    gap: 14,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: "#6C7278",
  },
  retryText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#F4F3F8",
    borderRadius: 48,
    padding: 6,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    height: 37,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabActive: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  filterTabText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#6C7278",
    textAlign: "center",
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.22,
    color: "#212B32",
    textAlign: "center",
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  chartTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: "#212B32",
  },
  chartComparison: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.primary,
  },
  chartEmpty: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  distributionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: "#212B32",
    marginBottom: SPACING.lg,
  },
  distributionBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xl,
    paddingTop: SPACING.xs,
  },
  legendCol: {
    flex: 1,
    gap: 12,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#6C7278",
  },
  legendPercent: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    color: "#212B32",
  },
});
