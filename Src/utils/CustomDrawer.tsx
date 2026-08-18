import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  GestureResponderEvent,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "./colors";
import { FONTS } from "./fonts";
import { RADIUS, SPACING } from "./spacing";
import { useUserProfile } from "../hooks/useUserProfile";
import { navigateMainTab } from "../navigation/navigationRef";

type DrawerItemProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  badge?: string;
};

const DrawerItem: React.FC<DrawerItemProps> = ({
  icon,
  label,
  onPress,
  badge,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.item}
        onPress={onPress}
        onPressIn={animateIn}
        onPressOut={animateOut}
        activeOpacity={0.9}
      >
        <View style={styles.left}>
          <View style={styles.iconContainer}>{icon}</View>
          <Text style={styles.label}>{label}</Text>
        </View>

        <View style={styles.right}>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}

          <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CustomDrawer: React.FC<DrawerContentComponentProps> = ({
  navigation,
}) => {
  const { firstName } = useUserProfile();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(translateAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      >
        {/* HEADER */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          }}
        >
          <LinearGradient colors={COLORS.gradient} style={styles.header}>
            <View style={styles.profileRow}>
              <Image
                source={require("../../assets/header-avatar.jpg")}
                style={styles.avatar}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Hello {firstName} 👋</Text>

                <Text style={styles.credit}>Ride credit: $250.00</Text>

                <TouchableOpacity
                  style={styles.profileBtn}
                  onPress={() => {
                    navigation.closeDrawer();
                    navigateMainTab("profile");
                  }}
                >
                  <Text style={styles.profileBtnText}>View Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* SECTION 1 */}
        <View style={styles.section}>
          <DrawerItem
            icon={
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            }
            label="Ride History"
            onPress={() => {
              navigation.closeDrawer();
              navigateMainTab("trips");
            }}
          />

          <DrawerItem
            icon={
              <Ionicons
                name="analytics-outline"
                size={20}
                color={COLORS.primary}
              />
            }
            label="Earning"
            onPress={() => {
              navigation.closeDrawer();
              navigateMainTab("earning");
            }}
          />

          <DrawerItem
            icon={
              <Ionicons name="card-outline" size={20} color={COLORS.primary} />
            }
            label="Payment"
            onPress={() => navigation.navigate("PaymentMethodScreen" as never)}
          />
        </View>

        {/* SECTION 2 */}
        <View style={styles.section}>
          <DrawerItem
            icon={
              <Ionicons
                name="location-outline"
                size={20}
                color={COLORS.primary}
              />
            }
            label="Saved places"
            onPress={() => navigation.navigate("AddressScreen" as never)}
          />

          <DrawerItem
            icon={
              <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
            }
            label="Favorite Drivers"
            onPress={() =>
              navigation.navigate("FavoriteDriversScreen" as never)
            }
          />
        </View>

        {/* SECTION 3 */}
        <View style={styles.section}>
          <DrawerItem
            icon={
              <Ionicons
                name="people-outline"
                size={20}
                color={COLORS.primary}
              />
            }
            label="Refer a Friend"
            onPress={() => navigation.navigate("ReferFriendScreen" as never)}
          />

          <DrawerItem
            icon={
              <Ionicons
                name="person-add-outline"
                size={20}
                color={COLORS.primary}
              />
            }
            label="Refer a driver"
            onPress={() => navigation.navigate("ReferDriverScreen" as never)}
          />
        </View>

        {/* SECTION 4 */}
        <View style={styles.section}>
          <DrawerItem
            icon={
              <Ionicons
                name="settings-outline"
                size={20}
                color={COLORS.primary}
              />
            }
            label="Settings"
            onPress={() => navigation.navigate("SettingScreen" as never)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  versionTop: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
  },

  versionText: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  versionDot: {
    marginHorizontal: 8,
    color: COLORS.text,
  },

  header: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.sheet,
    padding: SPACING.xl + 2,
    marginBottom: SPACING.lg + 2,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.white,
    marginRight: 16,
  },

  greeting: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: FONTS.bold,
  },

  credit: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    fontFamily: FONTS.medium,
  },

  profileBtn: {
    backgroundColor: COLORS.white,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },

  profileBtnText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },

  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: 14,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.iconBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  label: {
    fontSize: 15,
    color: COLORS.black,
    fontFamily: FONTS.medium,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
  },

  badge: {
    backgroundColor: COLORS.erroColor,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
});
