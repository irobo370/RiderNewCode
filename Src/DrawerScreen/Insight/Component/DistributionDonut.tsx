import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

import { FONTS } from "../../../utils/fonts";

type DonutSegment = {
  percent: number;
  color: string;
};

type DistributionDonutProps = {
  segments: DonutSegment[];
  centerValue: string | number;
  centerLabel?: string;
  size?: number;
  strokeWidth?: number;
  gapDegrees?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep <= 180 ? "0" : "1";

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function buildArcSegments(
  segments: DonutSegment[],
  gapDegrees: number,
): { start: number; end: number; color: string }[] {
  if (segments.length === 0) {
    return [];
  }

  const totalPercent = segments.reduce((sum, segment) => sum + segment.percent, 0);
  const normalized =
    totalPercent > 0
      ? segments.map((segment) => (segment.percent / totalPercent) * 100)
      : segments.map(() => 100 / segments.length);

  const totalGap = gapDegrees * segments.length;
  const available = Math.max(360 - totalGap, 0);
  let angle = -90 + gapDegrees / 2;

  return normalized.map((percent, index) => {
    const sweep = (percent / 100) * available;
    const start = angle;
    const end = angle + sweep;
    angle = end + gapDegrees;

    return {
      start,
      end,
      color: segments[index].color,
    };
  });
}

export default function DistributionDonut({
  segments,
  centerValue,
  centerLabel = "Total",
  size = 134,
  strokeWidth = 20,
  gapDegrees = 4,
}: DistributionDonutProps) {
  const center = size / 2;
  const radius = center - strokeWidth / 2;

  const arcs = useMemo(
    () => buildArcSegments(segments, gapDegrees),
    [segments, gapDegrees],
  );

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {arcs.map((arc, index) => (
          <Path
            key={`${arc.color}-${index}`}
            d={describeArc(center, center, radius, arc.start, arc.end)}
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>

      <View style={styles.centerLabel} pointerEvents="none">
        <Text style={styles.centerValue}>{centerValue}</Text>
        <Text style={styles.centerText}>{centerLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  centerValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 28,
    lineHeight: 28,
    color: "#212B32",
    textAlign: "center",
  },
  centerText: {
    marginTop: 2,
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#6C7278",
    textAlign: "center",
  },
});
