import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Line,
  Text as SvgText,
} from "react-native-svg";

import { FONTS } from "../../../utils/fonts";

type WeeklyTrendChartProps = {
  labels: string[];
  values: number[];
  yMax: number;
  yTicks: number[];
  width: number;
  height?: number;
};

type Point = { x: number; y: number };

const PADDING = {
  left: 28,
  right: 12,
  top: 8,
  bottom: 24,
};

function valueToY(value: number, yMax: number, plotHeight: number, top: number) {
  const clamped = Math.max(0, Math.min(value, yMax));
  return top + plotHeight - (clamped / yMax) * plotHeight;
}

function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(index - 1, 0)];
    const current = points[index];
    const next = points[index + 1];
    const following = points[Math.min(index + 2, points.length - 1)];

    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (following.x - current.x) / 6;
    const cp2y = next.y - (following.y - current.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  return path;
}

export default function WeeklyTrendChart({
  labels,
  values,
  yMax,
  yTicks,
  width,
  height = 170,
}: WeeklyTrendChartProps) {
  const plotLeft = PADDING.left;
  const plotTop = PADDING.top;
  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;
  const plotBottom = plotTop + plotHeight;

  const points = useMemo(() => {
    if (labels.length === 0) {
      return [] as Point[];
    }

    const stepX = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;

    return values.map((value, index) => ({
      x: plotLeft + stepX * index,
      y: valueToY(value, yMax, plotHeight, plotTop),
    }));
  }, [labels.length, plotHeight, plotLeft, plotWidth, values, yMax, plotTop]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);

  const areaPath = useMemo(() => {
    if (!linePath || points.length === 0) {
      return "";
    }

    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];

    return `${linePath} L ${lastPoint.x} ${plotBottom} L ${firstPoint.x} ${plotBottom} Z`;
  }, [linePath, plotBottom, points]);

  const uniqueTicks = useMemo(
    () => [...new Set(yTicks)].sort((a, b) => a - b),
    [yTicks],
  );

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#0773DE" />
            <Stop offset="1" stopColor="#37DDCC" />
          </LinearGradient>
          <LinearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C6DFF7" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {uniqueTicks.map((tick) => {
          const y = valueToY(tick, yMax, plotHeight, plotTop);

          return (
            <React.Fragment key={`grid-${tick}`}>
              <Line
                x1={plotLeft}
                y1={y}
                x2={plotLeft + plotWidth}
                y2={y}
                stroke="rgba(108, 114, 120, 0.1)"
                strokeWidth={0.8}
              />
              <SvgText
                x={plotLeft - 8}
                y={y + 4}
                fontSize={12}
                fill="rgba(108, 114, 120, 0.7)"
                textAnchor="end"
                fontFamily={FONTS.regular}
              >
                {tick}
              </SvgText>
            </React.Fragment>
          );
        })}

        {areaPath ? (
          <Path d={areaPath} fill="url(#trendAreaGradient)" />
        ) : null}

        {linePath ? (
          <Path
            d={linePath}
            stroke="url(#trendLineGradient)"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>

      <View style={[styles.xLabels, { left: plotLeft, width: plotWidth }]}>
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.xLabel} numberOfLines={1}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  xLabels: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xLabel: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(108, 114, 120, 0.7)",
    textAlign: "center",
  },
});
