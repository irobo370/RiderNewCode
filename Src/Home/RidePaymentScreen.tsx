import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { PrimaryButton } from "../components/ui/PrimaryButton";
import { useActiveRide } from "../context/ActiveRideContext";
import {
  RIDE_PAYMENT_METHODS,
  type RidePaymentMethodId,
} from "../constants/ridePaymentMethods";
import { DEFAULT_CURRENCY, COUNTRY_CODE, PHONE_LOCAL_DIGITS } from "../constants/locale";
import { getCurrencyMeta } from "../constants/countries";
import { payRide, getRide } from "../service/rideService/rideService";
import { ApiError } from "../service/api/types";
import { navigateToTripSummary } from "../navigation/navigationRef";
import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { TYPO } from "../utils/typography";
import { RADIUS, SPACING } from "../utils/spacing";
import { toE164Phone } from "../utils/phoneFormat";

function formatPayAmount(currency: string, amount: string | null | undefined) {
  if (!amount) return "—";
  const num = parseFloat(amount);
  const { symbol, locale } = getCurrencyMeta(currency);
  if (Number.isNaN(num)) return `${symbol}${amount}`;
  return `${symbol}${num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function RidePaymentScreen() {
  const insets = useSafeAreaInsets();
  const { activeRide, setTripPaymentMethod } = useActiveRide();
  const [selectedId, setSelectedId] = useState<RidePaymentMethodId>("mpesa");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [fareAmount, setFareAmount] = useState(
    activeRide?.final_fare ?? activeRide?.estimated_fare ?? "0",
  );

  useEffect(() => {
    const rideId = activeRide?.id;
    if (!rideId) return;

    let cancelled = false;
    getRide(rideId)
      .then((ride) => {
        if (cancelled) return;
        if (ride.final_fare || ride.estimated_fare) {
          setFareAmount(ride.final_fare ?? ride.estimated_fare ?? "0");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeRide?.id, activeRide?.final_fare, activeRide?.estimated_fare]);

  const selected = useMemo(
    () => RIDE_PAYMENT_METHODS.find((method) => method.id === selectedId),
    [selectedId],
  );

  const payLabel = formatPayAmount(DEFAULT_CURRENCY, fareAmount);
  const needsPhone = selected?.kind === "mobile_money";

  const handlePay = async () => {
    if (!selected) return;

    if (needsPhone) {
      const digits = phone.replace(/\D/g, "").replace(/^0/, "");
      if (digits.length < PHONE_LOCAL_DIGITS) {
        Toast.show({
          type: "error",
          text1: "Enter your wallet number",
          text2: `Use your ${selected.label} mobile number`,
        });
        return;
      }
    }

    setPaying(true);

    try {
      if (activeRide?.id) {
        try {
          await payRide(activeRide.id, {
            method: selected.id,
            amount: fareAmount,
            ...(needsPhone ? { phone: toE164Phone(phone) } : {}),
          });
        } catch (error) {
          const status = error instanceof ApiError ? error.status : undefined;
          if (status && status !== 404) {
            throw error;
          }
        }

        getRide(activeRide.id).catch(() => null);
      }

      setTripPaymentMethod({ id: selected.id, label: selected.label });
      Toast.show({
        type: "success",
        text1: selected.kind === "cash" ? "Cash selected" : "Payment sent",
        text2:
          selected.kind === "cash"
            ? "Please pay the driver in cash"
            : `Paid ${payLabel} with ${selected.label}`,
      });
      navigateToTripSummary();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Payment failed",
        text2:
          error instanceof Error
            ? error.message
            : "Unable to complete payment. Try again.",
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 108,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>Trip completed</Text>
        <Text style={styles.amount}>{payLabel}</Text>
        <Text style={styles.subtitle}>Choose how you want to pay</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>

          {RIDE_PAYMENT_METHODS.map((method, index) => {
            const selectedRow = method.id === selectedId;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.row,
                  index === RIDE_PAYMENT_METHODS.length - 1 && styles.rowLast,
                  selectedRow && styles.rowSelected,
                ]}
                onPress={() => setSelectedId(method.id)}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedRow }}
              >
                <View
                  style={[
                    styles.radio,
                    selectedRow && styles.radioSelected,
                  ]}
                >
                  {selectedRow ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.rowIcon}>
                  <Ionicons
                    name={method.icon}
                    size={20}
                    color={selectedRow ? COLORS.primary : COLORS.dark}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowLabel}>{method.label}</Text>
                  <Text style={styles.rowSubtitle}>{method.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {needsPhone ? (
            <View style={styles.phoneWrap}>
              <Text style={styles.phoneLabel}>
                {selected?.label} number
              </Text>
              <View style={styles.phoneField}>
                <Text style={styles.dialCode}>{COUNTRY_CODE}</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={(value) =>
                    setPhone(value.replace(/\D/g, "").slice(0, PHONE_LOCAL_DIGITS + 1))
                  }
                  keyboardType="phone-pad"
                  placeholder="812345678"
                  placeholderTextColor={COLORS.placeholder}
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <PrimaryButton
          label={
            selected?.kind === "cash" ? `Confirm ${payLabel}` : `Pay ${payLabel}`
          }
          onPress={handlePay}
          loading={paying}
          disabled={!selectedId}
        />
      </View>

      {paying ? (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  kicker: {
    ...TYPO.label,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  amount: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    lineHeight: 42,
    color: COLORS.dark,
    textAlign: "center",
  },
  subtitle: {
    ...TYPO.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 26,
    color: COLORS.dark,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    borderRadius: 14,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowSelected: {
    backgroundColor: COLORS.badgeBg,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C5CDD6",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.dark,
  },
  rowSubtitle: {
    ...TYPO.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  phoneWrap: {
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  phoneLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  phoneField: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    gap: 8,
  },
  dialCode: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.dark,
  },
  phoneInput: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 0,
  },
  footer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 0,
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.md,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 17, 17, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
});
