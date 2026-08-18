import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { SPACING } from "../../utils/spacing";

type OnboardingStepHeaderProps = {
  title: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
};

export function OnboardingProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <View style={styles.progressBarRow}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.progressSegment,
            index + 1 <= currentStep
              ? styles.progressSegmentActive
              : styles.progressSegmentInactive,
          ]}
        />
      ))}
    </View>
  );
}

export function OnboardingStepHeader({
  title,
  currentStep,
  totalSteps,
  onBack,
}: OnboardingStepHeaderProps) {
  return (
    <>
      {onBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={COLORS.dark} />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.title}>{title}</Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          Progress step: {currentStep} of {totalSteps}
        </Text>
        <OnboardingProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 23,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  progressLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
  },
  progressBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressSegment: {
    width: 16,
    height: 6,
    borderRadius: 12,
  },
  progressSegmentActive: {
    backgroundColor: COLORS.primary,
  },
  progressSegmentInactive: {
    backgroundColor: COLORS.borderSearch,
  },
});
