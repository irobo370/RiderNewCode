import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { RADIUS, SPACING } from "../../utils/spacing";
import { ScreenHeader } from "../../components/ui";
import {
  getSettings,
  patchSettings,
} from "../../service/settingsService/settingsService";
import { logoutRequest } from "../../redux/Auth/sessionSlice";
import {
  getLanguageLabel,
  LANGUAGE_OPTIONS,
} from "../../utils/settingsHelpers";
import { SUPPORT_PHONE } from "../../constants/locale";

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function IconBox({ children }: { children: React.ReactNode }) {
  return <View style={styles.iconBox}>{children}</View>;
}

function ChevronButton() {
  return (
    <View style={styles.chevronWrap}>
      <Ionicons name="chevron-forward" size={16} color={COLORS.dark} />
    </View>
  );
}

function SettingsToggle({
  value,
  onValueChange,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.toggleTrack, value ? styles.toggleTrackOn : styles.toggleTrackOff]}
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      activeOpacity={0.9}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <View style={styles.toggleThumb} />
    </TouchableOpacity>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  subtitleAccent = false,
  trailing,
  onPress,
  isFirst = false,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  subtitleAccent?: boolean;
  trailing?: React.ReactNode;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const content = (
    <View style={styles.rowInner}>
      <View style={styles.rowLeft}>
        <IconBox>
          <Ionicons name={icon} size={20} color={COLORS.dark} />
        </IconBox>
        <View style={styles.rowTextCol}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? (
            <Text
              style={[
                styles.rowSubtitle,
                subtitleAccent && styles.rowSubtitleAccent,
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {trailing ?? (onPress ? <ChevronButton /> : null)}
    </View>
  );

  const rowStyle = [
    styles.groupRow,
    isFirst && styles.groupRowFirst,
    isLast && styles.groupRowLast,
  ];

  if (onPress && !trailing) {
    return (
      <TouchableOpacity style={rowStyle} onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionBlock}>
      <SectionTitle title={title} />
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const [rideUpdates, setRideUpdates] = useState(true);
  const [specialOffers, setSpecialOffers] = useState(false);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const performAccountDeletion = () => {
    dispatch(logoutRequest());
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      "Delete account?",
      "You will be signed out of your Go4Ride account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: performAccountDeletion,
        },
      ],
    );
  };

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getSettings();
      setRideUpdates(settings.notifications_enabled);
      setLanguage(settings.language || "en");
    } catch {
      // Keep local defaults if settings API is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  const updateRideUpdates = async (next: boolean) => {
    const previous = rideUpdates;
    setRideUpdates(next);
    setSavingKey("rideUpdates");

    try {
      await patchSettings({ notifications_enabled: next });
    } catch (error: any) {
      setRideUpdates(previous);
      Toast.show({
        type: "error",
        text1: "Could not update setting",
        text2: error?.message ?? "Please try again",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const openLanguagePicker = () => {
    Alert.alert(
      "Language",
      "Choose your preferred language",
      LANGUAGE_OPTIONS.map((option) => ({
        text: option.label,
        onPress: async () => {
          const previous = language;
          setLanguage(option.code);
          setSavingKey("language");

          try {
            await patchSettings({ language: option.code });
          } catch (error: any) {
            setLanguage(previous);
            Toast.show({
              type: "error",
              text1: "Could not update language",
              text2: error?.message ?? "Please try again",
            });
          } finally {
            setSavingKey(null);
          }
        },
      })),
      { cancelable: true },
    );
  };

  const openLocationSettings = () => {
    Linking.openSettings().catch(() => {
      Toast.show({
        type: "error",
        text1: "Could not open settings",
        text2: "Please open location permissions manually",
      });
    });
  };

  const callSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      Toast.show({
        type: "error",
        text1: "Could not start call",
        text2: "Please try again",
      });
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <ScreenHeader title="Settings" style={styles.header} />

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <SettingsSection title="Notifications">
              <SettingsRow
                icon="notifications-outline"
                title="Ride Updates"
                isFirst
                trailing={
                  <SettingsToggle
                    value={rideUpdates}
                    onValueChange={updateRideUpdates}
                    disabled={savingKey === "rideUpdates"}
                  />
                }
              />
              <SettingsRow
                icon="pricetag-outline"
                title="Special Offers"
                isLast
                trailing={
                  <SettingsToggle
                    value={specialOffers}
                    onValueChange={setSpecialOffers}
                  />
                }
              />
            </SettingsSection>

            <SettingsSection title="Privacy & Safety">
              <SettingsRow
                icon="shield-outline"
                title="Data Sharing"
                isFirst
                onPress={() =>
                  Toast.show({
                    type: "info",
                    text1: "Data sharing",
                    text2: "This preference will be available soon",
                  })
                }
              />
              <SettingsRow
                icon="location-outline"
                title="Location Permission"
                isLast
                onPress={openLocationSettings}
              />
            </SettingsSection>

            <SettingsSection title="General">
              <SettingsRow
                icon="globe-outline"
                title="Language"
                subtitle={getLanguageLabel(language)}
                isFirst
                onPress={openLanguagePicker}
              />
              <SettingsRow
                icon="id-card-outline"
                title="Emergency Contact"
                subtitle="Add Contact"
                subtitleAccent
                isLast
                onPress={() =>
                  Toast.show({
                    type: "info",
                    text1: "Emergency contact",
                    text2: "Contact management will be available soon",
                  })
                }
              />
            </SettingsSection>

            <SettingsSection title="Support">
              <SettingsRow
                icon="help-circle-outline"
                title="Help Center"
                isFirst
                onPress={() =>
                  Toast.show({
                    type: "info",
                    text1: "Help Center",
                    text2: "Support articles will be available soon",
                  })
                }
              />
              <SettingsRow
                icon="call-outline"
                title="Call Support"
                isLast
                onPress={callSupport}
              />
            </SettingsSection>

            <SettingsSection title="Account">
              <SettingsRow
                icon="trash-outline"
                title="Delete Account"
                subtitle="Permanently remove your account and data"
                isFirst
                isLast
                onPress={confirmAccountDeletion}
              />
            </SettingsSection>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const CARD_BORDER = "rgba(33, 43, 50, 0.1)";
const ROW_BORDER = "rgba(16, 24, 40, 0.1)";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  header: {
    marginVertical: SPACING.md,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg + 2,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBlock: {
    gap: SPACING.sm + 2,
  },
  sectionTitle: {
    marginLeft: SPACING.xs,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "#6C7278",
  },
  groupCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  groupRow: {
    borderBottomWidth: 1,
    borderBottomColor: ROW_BORDER,
    paddingHorizontal: SPACING.lg + 4,
    paddingVertical: SPACING.lg + 4,
  },
  groupRowFirst: {
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
  },
  groupRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.input,
    backgroundColor: "rgba(16, 24, 40, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.dark,
  },
  rowSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
  },
  rowSubtitleAccent: {
    color: COLORS.primary,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(33, 43, 50, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTrack: {
    width: 32,
    height: 18,
    borderRadius: RADIUS.full,
    justifyContent: "center",
  },
  toggleTrackOn: {
    backgroundColor: COLORS.primary,
    alignItems: "flex-end",
    paddingRight: 2,
  },
  toggleTrackOff: {
    backgroundColor: "#EDEDED",
    alignItems: "flex-start",
    paddingLeft: 2,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
});
