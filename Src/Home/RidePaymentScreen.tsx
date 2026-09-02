import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useUserProfile } from "../hooks/useUserProfile";
import { useGatewayPaymentMethods } from "../hooks/payments/useGatewayPaymentMethods";
import { usePaymentStatusPoll } from "../hooks/payments/usePaymentStatusPoll";
import { PaymentCheckoutWebView } from "./Component/payment/PaymentCheckoutWebView";
import {
  PaymentFailedView,
  PaymentMethodsEmpty,
  PaymentMethodsError,
  PaymentMethodsLoading,
  PaymentPendingCard,
  PaymentPendingCash,
  PaymentPendingMobile,
  PaymentReceiptView,
  PaymentSuccessView,
} from "./Component/payment/PaymentFlowViews";
import {
  PAYMENT_RETURN_URL,
  formatPaymentAmount,
  getPaymentMethodIcon,
  getPaymentMethodKind,
  getPaymentMethodSubtitle,
  isMobileMoneyMethod,
  isPaymentFailedStatus,
  isPaymentSuccessStatus,
  logPayment,
} from "../constants/paymentGateway";
import { useCountryMarket } from "../context/CountryMarketContext";
import { getActiveCountry } from "../constants/locale";
import { initiatePayment } from "../service/paymentService/paymentGatewayService";
import { getRide } from "../service/rideService/rideService";
import type {
  GatewayPaymentMethod,
  InitiatePaymentRequest,
  PaymentMethodCode,
  PaymentStatusData,
} from "../service/api/types";
import { navigateToTripSummary } from "../navigation/navigationRef";
import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { TYPO } from "../utils/typography";
import { RADIUS, SPACING } from "../utils/spacing";
import { toE164Phone } from "../utils/phoneFormat";
import { loadPaymentSession } from "../utils/paymentSessionStorage";

function formatPaidAt(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

function localPhoneDigits(phone: string): string {
  const localLength = getActiveCountry().phoneLocalDigits;
  return phone.replace(/\D/g, "").replace(/^0/, "").slice(-localLength);
}

export default function RidePaymentScreen() {
  const insets = useSafeAreaInsets();
  const { country } = useCountryMarket();
  const countryCode = country.dialCode;
  const phoneLocalDigits = country.phoneLocalDigits;
  const defaultCurrency = country.currency;
  const { phone: profilePhone } = useUserProfile();
  const {
    activeRide,
    paymentSession,
    setTripPaymentMethod,
    patchPaymentSession,
    replacePaymentSession,
    resetPaymentSession,
  } = useActiveRide();

  const [selectedCode, setSelectedCode] = useState<PaymentMethodCode | null>(
    paymentSession.selectedMethod,
  );
  const [phone, setPhone] = useState("");
  const [fareAmount, setFareAmount] = useState(
    paymentSession.amount ??
      activeRide?.final_fare ??
      activeRide?.estimated_fare ??
      "0",
  );
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const initiatingRef = useRef(false);
  const restoredRef = useRef(false);

  const showMethods =
    paymentSession.status === "idle" || paymentSession.status === "loading";
  const methodsQuery = useGatewayPaymentMethods(showMethods);
  const methods = methodsQuery.data ?? [];

  const selected = useMemo(
    () => methods.find((method) => method.code === selectedCode) ?? null,
    [methods, selectedCode],
  );

  const currency =
    paymentSession.currency || defaultCurrency;
  const payLabel = formatPaymentAmount(
    currency,
    paymentSession.amount ?? fareAmount,
  );
  const methodLabel = paymentSession.methodName || selected?.name || "Payment";
  const needsPhone = isMobileMoneyMethod(selectedCode);
  const methodKind = getPaymentMethodKind(
    paymentSession.selectedMethod ?? selectedCode,
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

  useEffect(() => {
    if (phone || !profilePhone) {
      return;
    }
    setPhone(localPhoneDigits(profilePhone));
  }, [phone, profilePhone]);

  useEffect(() => {
    if (restoredRef.current || paymentSession.paymentId || !activeRide?.id) {
      return;
    }

    let cancelled = false;
    restoredRef.current = true;

    loadPaymentSession()
      .then((saved) => {
        if (cancelled || !saved || saved.rideId !== activeRide.id) {
          return;
        }
        replacePaymentSession(saved);
        if (saved.selectedMethod) {
          setSelectedCode(saved.selectedMethod);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeRide?.id, paymentSession.paymentId, replacePaymentSession]);

  const applyStatusResult = useCallback(
    (data: PaymentStatusData) => {
      if (paymentSession.status === "success") {
        return;
      }

      if (data.ride_id && activeRide?.id && data.ride_id !== activeRide.id) {
        return;
      }

      if (isPaymentSuccessStatus(data.status)) {
        logPayment("Payment status: success");
        patchPaymentSession({
          paymentId: data.payment_id,
          rideId: data.ride_id ?? activeRide?.id ?? paymentSession.rideId,
          status: "success",
          amount: data.amount ?? paymentSession.amount,
          currency: data.currency ?? paymentSession.currency,
          checkoutUrl: null,
          error: null,
          paidAt: paymentSession.paidAt ?? new Date().toISOString(),
        });
        setWebViewVisible(false);
        return;
      }

      if (isPaymentFailedStatus(data.status)) {
        patchPaymentSession({
          paymentId: data.payment_id,
          status: "failed",
          checkoutUrl: null,
          error: "Payment failed",
        });
        setWebViewVisible(false);
      }
    },
    [
      activeRide?.id,
      patchPaymentSession,
      paymentSession.amount,
      paymentSession.currency,
      paymentSession.paidAt,
      paymentSession.rideId,
      paymentSession.status,
    ],
  );

  useEffect(() => {
    if (paymentSession.status !== "success" || !paymentSession.methodName) {
      return;
    }
    setTripPaymentMethod({
      id: paymentSession.selectedMethod ?? "card",
      label: paymentSession.methodName,
    });
  }, [
    paymentSession.methodName,
    paymentSession.selectedMethod,
    paymentSession.status,
    setTripPaymentMethod,
  ]);

  usePaymentStatusPoll({
    paymentId: paymentSession.paymentId,
    enabled:
      paymentSession.status === "pending" && Boolean(paymentSession.paymentId),
    onStatus: applyStatusResult,
  });

  const handleInitiate = async () => {
    if (!selected || !activeRide?.id || initiatingRef.current) {
      return;
    }

    if (needsPhone) {
      const digits = phone.replace(/\D/g, "").replace(/^0/, "");
      if (digits.length < phoneLocalDigits) {
        Toast.show({
          type: "error",
          text1: "Enter your wallet number",
          text2: `Use your ${selected.name} mobile number`,
        });
        return;
      }
    }

    initiatingRef.current = true;
    patchPaymentSession({
      status: "loading",
      selectedMethod: selected.code,
      methodName: selected.name,
      rideId: activeRide.id,
      amount: fareAmount,
      currency,
      error: null,
    });

    const request: InitiatePaymentRequest = {
      ride_id: activeRide.id,
      payment_method: selected.code,
    };

    if (isMobileMoneyMethod(selected.code)) {
      request.customer_phone = toE164Phone(phone);
    }

    if (getPaymentMethodKind(selected.code) === "card") {
      request.return_url = PAYMENT_RETURN_URL;
    }

    try {
      const result = await initiatePayment(request);
      logPayment(`Payment initiated: ${result.payment_id}`);
      logPayment("Waiting for confirmation");

      patchPaymentSession({
        paymentId: result.payment_id,
        rideId: result.ride_id || activeRide.id,
        status: "pending",
        selectedMethod: selected.code,
        methodName: selected.name,
        amount: result.amount || fareAmount,
        currency: result.currency || currency,
        checkoutUrl: result.checkout_url,
        error: null,
      });

      if (
        getPaymentMethodKind(selected.code) === "card" &&
        result.checkout_url
      ) {
        setWebViewVisible(true);
      }
    } catch {
      logPayment("Payment initiation failed");
      patchPaymentSession({
        status: "idle",
        error: "Payment could not be initiated.",
      });
      Toast.show({
        type: "error",
        text1: "Payment could not be initiated.",
        text2: "Please try again.",
      });
    } finally {
      initiatingRef.current = false;
    }
  };

  const handleSuccessDone = () => {
    setTripPaymentMethod({
      id: paymentSession.selectedMethod ?? selectedCode ?? "card",
      label: methodLabel,
    });
    navigateToTripSummary();
  };

  const handleTryAnotherMethod = () => {
    setShowReceipt(false);
    setWebViewVisible(false);
    setSelectedCode(null);
    resetPaymentSession();
  };

  const renderMethods = () => {
    if (methodsQuery.isLoading) {
      return <PaymentMethodsLoading />;
    }

    if (methodsQuery.isError) {
      return (
        <PaymentMethodsError onRetry={() => void methodsQuery.refetch()} />
      );
    }

    if (methods.length === 0) {
      return (
        <PaymentMethodsEmpty onRetry={() => void methodsQuery.refetch()} />
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Payment Method</Text>

        {methods.map((method: GatewayPaymentMethod, index: number) => {
          const selectedRow = method.code === selectedCode;
          return (
            <TouchableOpacity
              key={method.code}
              style={[
                styles.row,
                index === methods.length - 1 && styles.rowLast,
                selectedRow && styles.rowSelected,
              ]}
              onPress={() => setSelectedCode(method.code)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedRow }}
              accessibilityLabel={method.name}
            >
              <View style={[styles.radio, selectedRow && styles.radioSelected]}>
                {selectedRow ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.rowIcon}>
                <Ionicons
                  name={getPaymentMethodIcon(method.code)}
                  size={20}
                  color={selectedRow ? COLORS.primary : COLORS.dark}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowLabel}>{method.name}</Text>
                <Text style={styles.rowSubtitle}>
                  {getPaymentMethodSubtitle(method.code)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {needsPhone ? (
          <View style={styles.phoneWrap}>
            <Text style={styles.phoneLabel}>{selected?.name} number</Text>
            <View style={styles.phoneField}>
              <Text style={styles.dialCode}>{countryCode}</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={(value) =>
                  setPhone(
                    value.replace(/\D/g, "").slice(0, phoneLocalDigits + 1),
                  )
                }
                keyboardType="phone-pad"
                placeholder="812345678"
                placeholderTextColor={COLORS.placeholder}
                accessibilityLabel="Mobile money phone number"
              />
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderPending = () => {
    if (methodKind === "cash") {
      return <PaymentPendingCash amountLabel={payLabel} />;
    }
    if (methodKind === "card") {
      return <PaymentPendingCard />;
    }
    return (
      <PaymentPendingMobile
        onCancel={() => {
          setWebViewVisible(false);
          patchPaymentSession({
            status: "idle",
            checkoutUrl: null,
            error: null,
          });
        }}
      />
    );
  };

  const initiating = paymentSession.status === "loading";
  const continueDisabled =
    !selectedCode || initiating || methodsQuery.isLoading || methods.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + (showMethods ? 108 : 32),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>Payment</Text>
        {showMethods ? (
          <>
            <Text style={styles.fareLabel}>Ride Fare</Text>
            <Text style={styles.amount}>{payLabel}</Text>
            {renderMethods()}
          </>
        ) : null}

        {paymentSession.status === "pending" ? renderPending() : null}

        {paymentSession.status === "success" && !showReceipt ? (
          <PaymentSuccessView
            amountLabel={payLabel}
            methodLabel={methodLabel}
            onViewReceipt={() => setShowReceipt(true)}
            onDone={handleSuccessDone}
          />
        ) : null}

        {paymentSession.status === "success" && showReceipt ? (
          <PaymentReceiptView
            rideId={paymentSession.rideId || activeRide?.id || "—"}
            paymentId={paymentSession.paymentId || "—"}
            amountLabel={payLabel}
            currency={currency}
            methodLabel={methodLabel}
            statusLabel="Paid"
            paidAtLabel={formatPaidAt(paymentSession.paidAt)}
            onDone={handleSuccessDone}
          />
        ) : null}

        {paymentSession.status === "failed" ? (
          <PaymentFailedView onRetry={handleTryAnotherMethod} />
        ) : null}
      </ScrollView>

      {showMethods ? (
        <View
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <PrimaryButton
            label="Continue"
            onPress={() => {
              void handleInitiate();
            }}
            loading={initiating}
            disabled={continueDisabled}
          />
        </View>
      ) : null}

      {initiating ? (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      ) : null}

      {paymentSession.checkoutUrl ? (
        <PaymentCheckoutWebView
          visible={webViewVisible}
          checkoutUrl={paymentSession.checkoutUrl}
          onReturnUrlReached={() => {
            logPayment("Card checkout return URL reached");
            setWebViewVisible(false);
          }}
          onClose={() => {
            setWebViewVisible(false);
          }}
        />
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
  fareLabel: {
    ...TYPO.body,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  amount: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    lineHeight: 42,
    color: COLORS.dark,
    textAlign: "center",
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
