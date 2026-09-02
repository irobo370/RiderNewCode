import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PrimaryButton } from "../../../components/ui/PrimaryButton";
import { COLORS } from "../../../utils/colors";
import { FONTS } from "../../../utils/fonts";
import { TYPO } from "../../../utils/typography";
import { RADIUS, SPACING } from "../../../utils/spacing";

export function PaymentStatusCard({
  icon,
  iconColor = COLORS.primary,
  title,
  body,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}14` }]}>
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {children}
    </View>
  );
}

export function PaymentInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function PaymentGhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.ghostButton}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function PaymentMethodsLoading() {
  return (
    <View style={styles.centeredCard}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.muted}>Loading payment methods…</Text>
    </View>
  );
}

export function PaymentMethodsError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredCard}>
      <Text style={styles.title}>Unable to load payment methods.</Text>
      <View style={styles.actionWrap}>
        <PrimaryButton label="Retry" onPress={onRetry} />
      </View>
    </View>
  );
}

export function PaymentMethodsEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredCard}>
      <Text style={styles.title}>No payment methods available.</Text>
      <Text style={styles.body}>Please try again in a moment.</Text>
      <View style={styles.actionWrap}>
        <PrimaryButton label="Retry" onPress={onRetry} />
      </View>
    </View>
  );
}

export function PaymentPendingMobile({
  onCancel,
}: {
  onCancel: () => void;
}) {
  return (
    <PaymentStatusCard
      icon="phone-portrait-outline"
      title="Payment Request Sent"
      body="A payment prompt has been sent to your phone."
    >
      <Text style={styles.body}>
        Please enter your Mobile Money PIN{"\n"}on your phone to complete the
        payment.
      </Text>
      <View style={styles.waitingRow}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.waitingText}>Waiting for payment confirmation...</Text>
      </View>
      <View style={styles.actionWrap}>
        <PaymentGhostButton label="Cancel" onPress={onCancel} />
      </View>
    </PaymentStatusCard>
  );
}

export function PaymentPendingCash({ amountLabel }: { amountLabel: string }) {
  return (
    <PaymentStatusCard
      icon="cash-outline"
      title="Cash Payment"
      body="Cash payment selected."
    >
      <Text style={styles.body}>Please pay the exact fare to the driver.</Text>
      <PaymentInfoRow label="Amount" value={amountLabel} />
      <View style={styles.waitingRow}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.waitingText}>Waiting for driver confirmation...</Text>
      </View>
    </PaymentStatusCard>
  );
}

export function PaymentPendingCard() {
  return (
    <PaymentStatusCard
      icon="card-outline"
      title="Confirming payment"
      body="Please wait while we confirm your card payment."
    >
      <View style={styles.waitingRow}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.waitingText}>Waiting for payment confirmation...</Text>
      </View>
    </PaymentStatusCard>
  );
}

export function PaymentSuccessView({
  amountLabel,
  methodLabel,
  onViewReceipt,
  onDone,
}: {
  amountLabel: string;
  methodLabel: string;
  onViewReceipt: () => void;
  onDone: () => void;
}) {
  return (
    <PaymentStatusCard
      icon="checkmark-circle"
      iconColor={COLORS.success}
      title="Payment Successful"
      body="Payment received successfully."
    >
      <PaymentInfoRow label="Amount" value={amountLabel} />
      <PaymentInfoRow label="Payment Method" value={methodLabel} />
      <View style={styles.actionWrap}>
        <PrimaryButton label="View Receipt" onPress={onViewReceipt} />
        <PaymentGhostButton label="Done" onPress={onDone} />
      </View>
    </PaymentStatusCard>
  );
}

export function PaymentFailedView({ onRetry }: { onRetry: () => void }) {
  return (
    <PaymentStatusCard
      icon="close-circle"
      iconColor={COLORS.error}
      title="Payment Failed"
      body="Please try another payment method."
    >
      <View style={styles.actionWrap}>
        <PrimaryButton label="Try another method" onPress={onRetry} />
      </View>
    </PaymentStatusCard>
  );
}

export function PaymentReceiptView({
  rideId,
  paymentId,
  amountLabel,
  currency,
  methodLabel,
  statusLabel,
  paidAtLabel,
  onDone,
}: {
  rideId: string;
  paymentId: string;
  amountLabel: string;
  currency: string;
  methodLabel: string;
  statusLabel: string;
  paidAtLabel: string;
  onDone: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Payment Receipt</Text>
      <PaymentInfoRow label="Ride ID" value={rideId} />
      <PaymentInfoRow label="Payment ID" value={paymentId} />
      <PaymentInfoRow label="Amount" value={amountLabel} />
      <PaymentInfoRow label="Currency" value={currency} />
      <PaymentInfoRow label="Payment Method" value={methodLabel} />
      <PaymentInfoRow label="Payment Status" value={statusLabel} />
      <PaymentInfoRow label="Date / Time" value={paidAtLabel} />
      <View style={styles.actionWrap}>
        <PrimaryButton label="Done" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
  },
  centeredCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 36,
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.dark,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    ...TYPO.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
  muted: {
    ...TYPO.body,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  waitingText: {
    ...TYPO.bodySm,
    color: COLORS.primary,
    flex: 1,
  },
  infoRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    ...TYPO.bodySm,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.dark,
    flexShrink: 1,
    textAlign: "right",
  },
  actionWrap: {
    width: "100%",
    marginTop: 24,
    gap: SPACING.sm,
  },
  ghostButton: {
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostLabel: {
    ...TYPO.button,
    color: COLORS.primary,
  },
});
