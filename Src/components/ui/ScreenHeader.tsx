import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../utils/colors";
import { TYPO } from "../../utils/typography";
import { SPACING, RADIUS } from "../../utils/spacing";
import { resetToHome } from "../../navigation/navigationRef";

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenHeader({
  title,
  onBack,
  rightSlot,
  style,
}: ScreenHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    resetToHome();
  };

  return (
    <View style={[styles.header, style]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.black} />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.right}>{rightSlot ?? <View style={styles.spacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...TYPO.h2,
    color: COLORS.black,
    flex: 1,
    textAlign: "center",
  },
  right: {
    width: 40,
    alignItems: "flex-end",
  },
  spacer: {
    width: 40,
  },
});
