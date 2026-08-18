import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { SPACING } from "../../utils/spacing";
import { navigateMainTab, type MainTabKey } from "../../navigation/navigationRef";

type TabKey = MainTabKey;

type HomeBottomTabBarProps = {
  activeTab?: TabKey;
  embedded?: boolean;
};

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] =
  [
    { key: "home", label: "Home", icon: "home" },
    { key: "trips", label: "Trips", icon: "time-outline" },
    { key: "earning", label: "Earning", icon: "wallet-outline" },
    { key: "profile", label: "Profile", icon: "person-outline" },
  ];

export default function HomeBottomTabBar({
  activeTab = "home",
  embedded = false,
}: HomeBottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: TabKey) => {
    if (tab === activeTab) {
      return;
    }

    navigateMainTab(tab);
  };

  return (
    <View
      style={[
        styles.container,
        embedded && styles.containerEmbedded,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => handleTabPress(tab.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={isActive ? COLORS.primary : COLORS.textLight}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm + 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.04,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -10 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  containerEmbedded: {
    position: "relative",
    left: undefined,
    right: undefined,
    bottom: undefined,
    zIndex: undefined,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 48,
  },
  label: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
  },
  labelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});
