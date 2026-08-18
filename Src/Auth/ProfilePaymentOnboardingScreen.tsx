import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { RADIUS, SPACING } from "../utils/spacing";
import { PrimaryButton } from "../components/ui";
import { OnboardingStepHeader } from "../components/onboarding/OnboardingStepHeader";
import { useOnboardingSkip } from "../hooks/useOnboardingSkip";
import {
  createPaymentMethod,
  listPaymentMethods,
} from "../service/paymentMethodService/paymentMethodService";
import { sessionUpdatePaymentMethods } from "../redux/Auth/sessionSlice";
import { resetToHome } from "../navigation/navigationRef";

// Step 3: Payment method onboarding — currently commented out of the post-login flow
const TOTAL_STEPS = 3;
const CURRENT_STEP = 3;

type RootStackParamList = {
  ProfileAddressOnboardingScreen: undefined;
  ProfilePaymentOnboardingScreen: undefined;
};

function inferCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");

  if (digits.startsWith("4")) {
    return "visa";
  }
  if (digits.startsWith("5")) {
    return "mastercard";
  }
  if (digits.startsWith("3")) {
    return "amex";
  }

  return "card";
}

function parseExpiry(
  expiry: string,
): { exp_month: number; exp_year: number } | null {
  const match = expiry.trim().match(/^(\d{2})\s*\/?\s*(\d{2,4})$/);

  if (!match) {
    return null;
  }

  const expMonth = Number(match[1]);
  let expYear = Number(match[2]);

  if (expYear < 100) {
    expYear += 2000;
  }

  if (expMonth < 1 || expMonth > 12) {
    return null;
  }

  return { exp_month: expMonth, exp_year: expYear };
}

export default function ProfilePaymentOnboardingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const handleSkip = useOnboardingSkip(CURRENT_STEP);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasCardInput =
    cardNumber.trim().length > 0 ||
    expiry.trim().length > 0 ||
    cvv.trim().length > 0;
  const hasUpiInput = upiId.trim().length > 0;

  const handleBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "ProfileAddressOnboardingScreen" }],
    });
  };

  const handleContinue = async () => {
    if (!hasCardInput && !hasUpiInput) {
      Toast.show({
        type: "error",
        text1: "Payment method required",
        text2: "Add a card or UPI ID to continue",
      });
      return;
    }

    if (hasCardInput && hasUpiInput) {
      Toast.show({
        type: "error",
        text1: "One method at a time",
        text2: "Add either a card or a UPI ID",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (hasUpiInput) {
        const trimmedUpi = upiId.trim();
        if (!/^[^\s@]+@[^\s@]+$/.test(trimmedUpi)) {
          Toast.show({
            type: "error",
            text1: "Invalid UPI ID",
            text2: "Enter a valid UPI address",
          });
          return;
        }

        const handle = trimmedUpi.split("@")[0] ?? trimmedUpi;
        await createPaymentMethod({
          brand: "upi",
          last4: handle.slice(-4).padStart(4, "0"),
          exp_month: 12,
          exp_year: 2099,
          is_default: true,
        });
      } else {
        const digits = cardNumber.replace(/\D/g, "");
        if (digits.length < 13) {
          Toast.show({
            type: "error",
            text1: "Invalid card number",
            text2: "Enter a valid card number",
          });
          return;
        }

        const parsedExpiry = parseExpiry(expiry);
        if (!parsedExpiry) {
          Toast.show({
            type: "error",
            text1: "Invalid expiry date",
            text2: "Use MM/YY format",
          });
          return;
        }

        if (cvv.trim().length < 3) {
          Toast.show({
            type: "error",
            text1: "Invalid CVV",
            text2: "Enter the card security code",
          });
          return;
        }

        await createPaymentMethod({
          brand: inferCardBrand(digits),
          last4: digits.slice(-4),
          exp_month: parsedExpiry.exp_month,
          exp_year: parsedExpiry.exp_year,
          is_default: true,
        });
      }

      const paymentMethods = await listPaymentMethods();
      dispatch(sessionUpdatePaymentMethods(paymentMethods));
      resetToHome();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not save payment method",
        text2: error?.message ?? "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OnboardingStepHeader
            title="Add Payment Method"
            currentStep={CURRENT_STEP}
            totalSteps={TOTAL_STEPS}
            onBack={handleBack}
          />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Add Credit / Debit Card</Text>
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              placeholderTextColor="rgba(96, 112, 128, 0.5)"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="number-pad"
              maxLength={19}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Expiry date"
                placeholderTextColor="rgba(96, 112, 128, 0.5)"
                value={expiry}
                onChangeText={setExpiry}
                keyboardType="number-pad"
                maxLength={7}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="CVV"
                placeholderTextColor="rgba(96, 112, 128, 0.5)"
                value={cvv}
                onChangeText={setCvv}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
            </View>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Add UPI ID</Text>
            <TextInput
              style={styles.input}
              placeholder="example@upi"
              placeholderTextColor="rgba(96, 112, 128, 0.5)"
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Continue"
            onPress={handleContinue}
            loading={submitting}
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
          />
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  section: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "#343434",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(205, 205, 205, 0.6)",
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.dark,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(169, 163, 147, 0.2)",
  },
  dividerText: {
    paddingHorizontal: 6,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
    backgroundColor: COLORS.white,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl + 6,
    alignItems: "center",
  },
  continueButton: {
    borderRadius: RADIUS.full,
  },
  continueButtonText: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: FONTS.semiBold,
  },
  skipButton: {
    width: "100%",
    alignItems: "center",
  },
  skipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 15,
    color: COLORS.primary,
    textAlign: "center",
  },
});
