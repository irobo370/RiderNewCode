import type { InsightsData, InsightsPeriod } from "../service/api/types";
import { getCurrencyMeta } from "../constants/countries";

const DISTRIBUTION_COLORS = ["#0773DE", "#37DDCC", "#ADC6FF"];

export function getDistributionColor(index: number): string {
  return DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length];
}

export function formatInsightAmount(amount: string, currency: string): string {
  const value = Number.parseFloat(amount);
  const { symbol, locale } = getCurrencyMeta(currency);

  if (Number.isNaN(value)) {
    return `${symbol}0`;
  }

  return `${symbol}${Math.round(value).toLocaleString(locale)}`;
}

export function formatInsightDistance(km: string): string {
  const value = Number.parseFloat(km);

  if (Number.isNaN(value)) {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatComparisonText(
  comparisonPct: number,
  period: InsightsPeriod,
): string {
  const sign = comparisonPct > 0 ? "+" : "";
  const rounded = Math.round(comparisonPct);
  const label = period === "weekly" ? "last week" : "last month";
  return `${sign}${rounded}% vs ${label}`;
}

export function getTrendYAxis(maxValue: number) {
  if (maxValue <= 10) {
    return { yMax: 10, ticks: [0, 5, 10] };
  }

  if (maxValue <= 20) {
    return { yMax: 20, ticks: [0, 10, 20] };
  }

  if (maxValue <= 50) {
    return { yMax: 50, ticks: [0, 10, 20, 50] };
  }

  const yMax = Math.ceil(maxValue / 10) * 10;
  const step = yMax / 4;
  return {
    yMax,
    ticks: [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), yMax],
  };
}

export function getTrendChartData(insights: InsightsData) {
  const labels = insights.trend.map((point) => point.label);
  const values = insights.trend.map((point) => point.ride_count ?? 0);

  if (labels.length === 0) {
    return { labels: [], values: [], maxValue: 1, yAxis: getTrendYAxis(1) };
  }

  if (labels.length === 1) {
    const yAxis = getTrendYAxis(Math.max(values[0], 1));
    return {
      labels: [labels[0], labels[0]],
      values: [values[0], values[0]],
      maxValue: Math.max(values[0], 1),
      yAxis,
    };
  }

  const maxValue = Math.max(...values, 1);
  const yAxis = getTrendYAxis(maxValue);

  return { labels, values, maxValue, yAxis };
}

export function getDistributionChartData(insights: InsightsData) {
  return insights.distribution.map((item, index) => ({
    name: item.name,
    count: item.count,
    percent: item.percent,
    color: getDistributionColor(index),
  }));
}

export function getShortRideTypeName(name: string): string {
  const normalized = name.trim();

  if (/mini/i.test(normalized)) {
    return "Mini";
  }
  if (/bike/i.test(normalized)) {
    return "Bike";
  }
  if (/xl|suv/i.test(normalized)) {
    return "XL";
  }

  return normalized.split(" ").slice(-1)[0] ?? normalized;
}
