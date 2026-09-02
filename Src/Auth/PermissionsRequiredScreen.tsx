import React, { useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  AppState,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import { PrimaryButton } from "../components/ui";
import { useAppPermissions } from "../hooks/useAppPermissions";
import {
  permissionStatusLabel,
  type PermissionUiStatus,
} from "../permissions/appPermissions";
import {
  completeInitialSplash,
  navigationRef,
  resetAfterAuth,
  resetToLogin,
} from "../navigation/navigationRef";
import type { OnboardingStep } from "../utils/onboardingProgress";
import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { RADIUS, SPACING } from "../utils/spacing";

function statusColor(status: PermissionUiStatus): string {
  switch (status) {
    case "granted":
      return "#159A4B";
    case "blocked":
      return COLORS.erroColor;
    case "denied":
      return "#C47A00";
    default:
      return COLORS.textMuted;
  }
}

function statusIcon(
  status: PermissionUiStatus,
): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case "granted":
      return "checkmark-circle";
    case "blocked":
      return "lock-closed";
    case "denied":
      return "close-circle";
    default:
      return "ellipse-outline";
  }
}

export default function PermissionsRequiredScreen() {
  const hasContinued = useRef(false);
  const hasRequestedOnce = useRef(false);
  const continueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { permissions, loading, requesting, requestMissing } =
    useAppPermissions();

  const { isAuthenticated, onboardingStep } = useSelector(
    (state: {
      session?: {
        isAuthenticated?: boolean;
        onboardingStep?: OnboardingStep | null;
      };
    }) => state.session ?? {},
  );

  const continueIntoApp = useCallback(() => {
    if (hasContinued.current) {
      return;
    }

    // iOS permission sheet leaves the app inactive briefly. Navigating during
    // that window can be dropped; only continue once we're active again so
    // first-time users reach Login instead of staying on this gate.
    if (AppState.currentState !== "active") {
      return;
    }
    if (!navigationRef.isReady()) {
      return;
    }

    const go = () => {
      if (hasContinued.current || !navigationRef.isReady()) {
        return;
      }
      hasContinued.current = true;
      completeInitialSplash();

      if (isAuthenticated) {
        resetAfterAuth(onboardingStep ?? null);
        return;
      }
      resetToLogin();
    };

    InteractionManager.runAfterInteractions(() => {
      if (continueTimerRef.current) {
        clearTimeout(continueTimerRef.current);
      }
      continueTimerRef.current = setTimeout(go, 50);
    });
  }, [isAuthenticated, onboardingStep]);

  useEffect(() => {
    return () => {
      if (continueTimerRef.current) {
        clearTimeout(continueTimerRef.current);
      }
    };
  }, []);

  // This screen is purely informational: iOS Location Services is treated as
  // an optional capability (App Review 5.1.5), so we continue into the app
  // once the user has responded to the request — whether they allow or deny
  // it — rather than gating on the result. We don't call continueIntoApp()
  // directly from the button handler because the native permission sheet can
  // briefly deactivate the app; instead we advance once `requesting` finishes
  // and, as a backup, whenever the app returns to the foreground.
  useEffect(() => {
    if (hasRequestedOnce.current && !loading && !requesting) {
      continueIntoApp();
    }
  }, [continueIntoApp, loading, requesting]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && hasRequestedOnce.current && !loading) {
        continueIntoApp();
      }
    });
    return () => subscription.remove();
  }, [continueIntoApp, loading]);

  const onContinuePress = async () => {
    hasRequestedOnce.current = true;
    await requestMissing();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Location Access</Text>
        <Text style={styles.subtitle}>
          Location access helps provide location-based features such as
          showing your position on the map, setting your pickup point, and
          connecting you with nearby drivers. You can choose whether to allow
          access when iOS asks for permission — the rest of Go4Ride works
          either way.
        </Text>

        {loading && permissions.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Checking permissions…</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {permissions.map((permission) => (
              <View key={permission.id} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons
                    name={
                      permission.id === "location"
                        ? "location-outline"
                        : "shield-checkmark-outline"
                    }
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <View style={styles.rowTitleLine}>
                    <Text style={styles.rowTitle}>{permission.title}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{permission.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.rowDescription}>
                    {permission.description}
                  </Text>
                </View>
                <View style={styles.statusWrap}>
                  <Ionicons
                    name={statusIcon(permission.status)}
                    size={18}
                    color={statusColor(permission.status)}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusColor(permission.status) },
                    ]}
                  >
                    {permissionStatusLabel(permission.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          onPress={() => {
            void onContinuePress();
          }}
          loading={requesting}
          height={48}
          style={styles.primaryBtn}
          textStyle={styles.primaryBtnText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  logo: {
    width: 125,
    height: 50,
    alignSelf: "center",
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 30,
    color: "#1F1F1F",
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#6C7278",
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  loadingBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  rowTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: "#1F1F1F",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(7, 115, 222, 0.1)",
  },
  badgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  rowDescription: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
    color: "#6C7278",
  },
  statusWrap: {
    alignItems: "center",
    gap: 4,
    minWidth: 64,
  },
  statusText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: 10,
  },
  primaryBtn: {
    borderRadius: RADIUS.full,
    ...Platform.select({
      ios: {
        shadowColor: "#0773DE",
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 12 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 16,
    color: "#FEFCFF",
  },
});
