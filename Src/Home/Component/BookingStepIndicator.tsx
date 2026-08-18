import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";

export type BookingStep = "where" | "ride" | "confirm" | "go";

const STEPS: { key: BookingStep; label: string }[] = [
  { key: "where", label: "Where" },
  { key: "ride", label: "Ride" },
  { key: "confirm", label: "Confirm" },
  { key: "go", label: "Go" },
];

type BookingStepIndicatorProps = {
  currentStep: BookingStep;
};

export default function BookingStepIndicator({
  currentStep,
}: BookingStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <View key={step.key} style={styles.stepWrap}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.dot,
                  isComplete && styles.dotComplete,
                  isActive && styles.dotActive,
                ]}
              />
              {index < STEPS.length - 1 ? (
                <View
                  style={[
                    styles.line,
                    isComplete && styles.lineComplete,
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                (isActive || isComplete) && styles.labelActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  stepWrap: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  dotComplete: {
    backgroundColor: COLORS.secondary,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.15 }],
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
    maxWidth: 36,
  },
  lineComplete: {
    backgroundColor: COLORS.secondary,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textLight,
  },
  labelActive: {
    color: COLORS.black,
  },
});
