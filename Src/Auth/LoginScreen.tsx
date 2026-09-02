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
import { useCountryMarket } from "../context/CountryMarketContext";
import { toE164Phone } from "../utils/phoneFormat";
import { authReset, loginRequest } from "../redux/Auth/authSlice";
import { PrimaryButton } from "../components/ui";
import CountryCodePicker from "../components/CountryCodePicker";
import type { CountryId } from "../constants/countries";

type RootStackParamList = {
  LoginScreen: undefined;
  OtpScreen: {
    phone: string;
    loginData: unknown;
  };
};

export default function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { country, selectCountry } = useCountryMarket();
  const countryCode = country.dialCode;
  const phoneLocalDigits = country.phoneLocalDigits;
  const [phone, setPhone] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [error, setError] = useState("");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
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

  useEffect(() => {
    setPhone((prev) => prev.slice(0, phoneLocalDigits + 1));
  }, [phoneLocalDigits]);

  const onSelectCountry = async (countryId: CountryId) => {
    await selectCountry(countryId);
    setError("");
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <Spinner
        visible={loading}
        textContent="Sending OTP..."
        textStyle={{ color: COLORS.white }}
      />

      <CountryCodePicker
        visible={countryPickerOpen}
        selectedId={country.id}
        onSelect={onSelectCountry}
        onClose={() => setCountryPickerOpen(false)}
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
            Choose your country and enter your phone number
          </Text>
        </View>

        <View style={styles.formBlock}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.countryCodeButton}
              onPress={() => setCountryPickerOpen(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select country code"
            >
              <Text style={styles.countryCode}>{countryCode}</Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color="#6C7278"
                style={styles.countryChevron}
              />
            </TouchableOpacity>
            <View style={styles.inputDivider} />
            <TextInput
              placeholder="Mobile number"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
              style={styles.input}
              value={phone}
              onChangeText={(text) => {
                setPhone(
                  text.replace(/[^0-9]/g, "").slice(0, phoneLocalDigits + 1),
                );
                setError("");
              }}
              maxLength={phoneLocalDigits + 1}
            />
          </View>

          <Text style={styles.marketHint}>
            {country.pickerLabel} · search & map set to {country.city}
          </Text>

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
    marginBottom: SPACING.sm,
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCode: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.01,
    color: "#1F1F1F",
  },
  countryChevron: {
    marginLeft: 4,
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
  marketHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    color: "#6C7278",
    marginBottom: SPACING.xxl + 4,
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
});
