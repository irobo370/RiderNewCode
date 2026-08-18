import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/colors";
import { TYPO } from "../../utils/typography";

type HomeSearchBarProps = {
  onPress: () => void;
  style?: object;
  guidanceText?: string | null;
  showGuidanceChevron?: boolean;
};

export default function HomeSearchBar({
  onPress,
  style,
  guidanceText,
  showGuidanceChevron = false,
}: HomeSearchBarProps) {
  return (
    <View style={style}>
      {guidanceText ? (
        <View style={styles.guidanceRow}>
          {showGuidanceChevron ? (
            <Ionicons name="arrow-down" size={14} color={COLORS.primary} />
          ) : (
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={COLORS.primary}
            />
          )}
          <Text style={styles.guidanceText}>{guidanceText}</Text>
        </View>
      ) : null}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Where to go"
      >
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <Text style={styles.searchPlaceholder}>Where to go?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  guidanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  guidanceText: {
    ...TYPO.caption,
    color: COLORS.primary,
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderSearch,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.02,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchPlaceholder: {
    ...TYPO.body,
    color: COLORS.textMuted,
  },
});
