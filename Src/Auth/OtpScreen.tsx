import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "react-native-loading-spinner-overlay";
import Toast from "react-native-toast-message";

import { FONTS } from "../utils/fonts";
import { COLORS } from "../utils/colors";
import { RADIUS, SPACING } from "../utils/spacing";
import { formatPhoneDisplay } from "../utils/phoneFormat";
import { loginRequest } from "../redux/Auth/authSlice";
import { verifyOtpRequest } from "../redux/Auth/verifyOtpSlice";
import { PrimaryButton } from "../components/ui";

type LoginData = {
  success?: boolean;
  data?: { debug_otp?: string };
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 10;

type RootStackParamList = {
  LoginScreen: undefined;
  OtpScreen: {
    phone: string;
    loginData: LoginData;
  };
};

export default function OtpScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "OtpScreen">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const phone = route.params?.phone ?? "";
  const [loginData, setLoginData] = useState<LoginData | undefined>(
    route.params?.loginData,
  );
  const formattedPhone = formatPhoneDisplay(phone);

  const authUser = useSelector(
    (state: { auth?: { user?: LoginData } }) => state.auth?.user,
  );

  const { loading, error } = useSelector(
    (state: { verifyOtp?: { loading?: boolean; error?: string } }) =>
      state.verifyOtp ?? {},
  );
  const authLoading = useSelector(
    (state: { auth?: { loading?: boolean } }) => state.auth?.loading ?? false,
  );

  useEffect(() => {
    if (authUser?.success) {
      setLoginData(authUser);
    }
  }, [authUser]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "OTP Verification Failed",
        text2: error,
      });
    }
  }, [error]);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("LoginScreen");
  };

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/[^0-9]/g, "");

    if (digits.length > 1) {
      const pasted = digits.slice(0, OTP_LENGTH).split("");
      const nextOtp = [...otp];

      pasted.forEach((digit, i) => {
        nextOtp[i] = digit;
      });

      setOtp(nextOtp);
      inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = digits;
    setOtp(nextOtp);

    if (digits && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join("");
    const debugOtp = loginData?.data?.debug_otp;

    if (enteredOtp.length !== OTP_LENGTH) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter the 6-digit code",
      });
      return;
    }

    if (debugOtp && enteredOtp !== debugOtp) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter the correct verification code",
      });
      return;
    }

    dispatch(
      verifyOtpRequest({
        code: enteredOtp,
        phone,
      }),
    );
  };

  const handleResend = useCallback(() => {
    if (timer > 0 || !phone) {
      return;
    }

    dispatch(loginRequest({ phone }));
    setTimer(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();

    Toast.show({
      type: "success",
      text1: "OTP sent",
      text2: "A new verification code has been sent.",
    });
  }, [dispatch, phone, timer]);

  const otpComplete = otp.every((digit) => digit.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <Spinner
        visible={loading}
        textContent="Verifying OTP..."
        textStyle={{ color: COLORS.white }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color="#1F1F1F" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>OTP Verification</Text>
          </View>

          <Text style={styles.instructionText}>
            We have sent a verification code to
          </Text>
          <Text style={styles.phoneLine}>{formattedPhone}</Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                keyboardType="number-pad"
                value={digit}
                maxLength={index === 0 ? OTP_LENGTH : 1}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (
                    nativeEvent.key === "Backspace" &&
                    !otp[index] &&
                    index > 0
                  ) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
                textAlign="center"
                selectionColor={COLORS.primary}
              />
            ))}
          </View>

          <PrimaryButton
            label="Continue"
            onPress={handleVerify}
            loading={loading}
            disabled={!otpComplete}
            height={48}
            style={styles.continueButton}
            textStyle={styles.continueText}
          />

          <TouchableOpacity
            onPress={handleResend}
            disabled={timer > 0 || authLoading}
            accessibilityRole="button"
          >
            <Text style={styles.resendText}>
              Didn&apos;t get the OTP?{" "}
              {timer > 0 ? (
                <Text style={styles.resendMuted}>Resend SMS in {timer}s</Text>
              ) : (
                <Text style={styles.resendActive}>Resend SMS</Text>
              )}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxxl + 4,
  },
  backButton: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 20,
    color: "#1F1F1F",
  },
  instructionText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
    color: "#6C7278",
    textAlign: "center",
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  phoneLine: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
    color: "#1F1F1F",
    textAlign: "center",
    marginBottom: SPACING.xxxl + 4,
    paddingHorizontal: SPACING.md,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: SPACING.xl,
  },
  otpBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(205, 205, 205, 0.6)",
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: "#1F1F1F",
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
  },
  continueButton: {
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xl,
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
  continueText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 16,
    color: "#FEFCFF",
  },
  resendText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: "#1F1F1F",
    textAlign: "center",
  },
  resendMuted: {
    fontFamily: FONTS.regular,
    color: "#6C7278",
  },
  resendActive: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});
