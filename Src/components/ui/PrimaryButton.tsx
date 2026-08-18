import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../utils/colors";
import { TYPO } from "../../utils/typography";
import { RADIUS, SHADOW, SPACING } from "../../utils/spacing";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  height?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  height = 55,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.wrapper, style, isDisabled && styles.disabled]}
    >
      <LinearGradient
        colors={COLORS.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, { height, borderRadius: RADIUS.full }]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={[styles.text, textStyle]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: RADIUS.button,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW.button.shadowColor,
        shadowOpacity: SHADOW.button.shadowOpacity,
        shadowRadius: SHADOW.button.shadowRadius,
        shadowOffset: SHADOW.button.shadowOffset,
      },
      android: {
        elevation: SHADOW.button.elevation,
      },
    }),
  },
  button: {
    height: 55,
    borderRadius: RADIUS.button,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
  },
  text: {
    ...TYPO.button,
    color: COLORS.white,
  },
  disabled: {
    opacity: 0.6,
  },
});
