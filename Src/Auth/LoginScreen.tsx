import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Spinner from "react-native-loading-spinner-overlay";
import Toast from "react-native-toast-message";

import { FONTS } from "../utils/fonts";
import { COLORS } from "../utils/colors";
import { RADIUS, SPACING } from "../utils/spacing";
import { validatePhone } from "../utils/validation";
import { COUNTRY_CODE, PHONE_LOCAL_DIGITS } from "../constants/locale";
import { toE164Phone } from "../utils/phoneFormat";
import { authReset, loginRequest } from "../redux/Auth/authSlice";
import { PrimaryButton } from "../components/ui";

type RootStackParamList = {
  LoginScreen: undefined;
  OtpScreen: {
    phone: string;
    loginData: unknown;
  };
};

function SocialButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.socialButton}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [phone, setPhone] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const auth = useSelector(
    (state: {
      auth?: {
        loading?: boolean;
        user?: { success?: boolean };
        error?: string;
      };
    }) => state.auth,
  );
  const loading = auth?.loading || false;
  const apiError = auth?.error;
  const user = auth?.user;

  useEffect(() => {
    if (user?.success && fullPhone.trim()) {
      navigation.navigate("OtpScreen", {
        phone: fullPhone,
        loginData: user,
      });
      dispatch(authReset());
    }
  }, [dispatch, navigation, fullPhone, user]);

  useEffect(() => {
    if (apiError) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: apiError,
      });
    }
  }, [apiError]);

  const onLogin = () => {
    const validationError = validatePhone(phone);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    const e164 = toE164Phone(phone);
    setFullPhone(e164);
    dispatch(loginRequest({ phone: e164 }));
  };

  const showComingSoon = () => {
    Toast.show({
      type: "info",
      text1: "Coming soon",
      text2: "Social login will be available in a future update.",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Spinner
        visible={loading}
        textContent="Sending OTP..."
        textStyle={{ color: COLORS.white }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.headerText}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to continue
          </Text>
        </View>

        <View style={styles.formBlock}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.countryCode}>{COUNTRY_CODE}</Text>
            <View style={styles.inputDivider} />
            <TextInput
              placeholder="8X XXX XXXX"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
              style={styles.input}
              value={phone}
              onChangeText={(text) => {
                // Local mobile digits after dial code (leading 0 optional while typing)
                setPhone(
                  text.replace(/[^0-9]/g, "").slice(0, PHONE_LOCAL_DIGITS + 1),
                );
                setError("");
              }}
              maxLength={PHONE_LOCAL_DIGITS + 1}
            />
          </View>

          <PrimaryButton
            label="Continue"
            onPress={onLogin}
            loading={loading}
            height={48}
            style={styles.continueButton}
            textStyle={styles.continueText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  logo: {
    width: 125,
    height: 50,
    alignSelf: "center",
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xxxl + 8,
  },
  headerText: {
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.xxxl + 4,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 30,
    color: "#1F1F1F",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
    textAlign: "center",
  },
  formBlock: {
    width: "100%",
    maxWidth: 353,
    alignSelf: "center",
  },
  inputLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "#343434",
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "rgba(205, 205, 205, 0.6)",
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    height: 50,
    marginBottom: SPACING.xxl + 4,
  },
  countryCode: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.01,
    color: "#1F1F1F",
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(96, 112, 128, 0.2)",
    marginHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: "#1F1F1F",
    paddingVertical: 0,
  },
  errorText: {
    color: COLORS.erroColor,
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  continueButton: {
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
  continueText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 16,
    color: "#FEFCFF",
  },
  socialSection: {
    width: "100%",
    maxWidth: 353,
    alignSelf: "center",
    marginTop: SPACING.xxxl + 12,
    gap: 30,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(96, 112, 128, 0.15)",
  },
  dividerText: {
    paddingHorizontal: 6,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#6C7278",
    backgroundColor: COLORS.white,
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialButton: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#EFEEF1",
    borderRadius: 48,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  socialLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
    color: "#1F1F1F",
  },
});
