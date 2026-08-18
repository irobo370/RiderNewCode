import React, { useEffect, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { RADIUS, SPACING } from "../utils/spacing";
import { validateEmail } from "../utils/validation";
import { PrimaryButton } from "../components/ui";
import { OnboardingStepHeader } from "../components/onboarding/OnboardingStepHeader";
import { patchProfile } from "../service/profileService/profileService";
import { sessionUpdateProfile } from "../redux/Auth/sessionSlice";
import { useOnboardingSkip } from "../hooks/useOnboardingSkip";

// Step 2 (Add New Address) + Step 3 (payment) temporarily disabled — was 2 / 3
const TOTAL_STEPS = 1;
const CURRENT_STEP = 1;

type RootStackParamList = {
  ProfileOnboardingScreen: undefined;
  // ProfileAddressOnboardingScreen: undefined;
  DrawerNavigator: undefined;
};

export default function ProfileOnboardingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const profile = useSelector((state: any) => state.session?.profile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleSkip = useOnboardingSkip(CURRENT_STEP);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
    if (profile?.email) {
      setEmail(profile.email);
    }
  }, [profile]);

  const validateForm = () => {
    let valid = true;
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Full name is required");
      valid = false;
    } else {
      setNameError("");
    }

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      valid = false;
    } else {
      setEmailError("");
    }

    return valid;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const updatedProfile = await patchProfile({
        name: name.trim(),
        email: email.trim(),
      });
      dispatch(sessionUpdateProfile(updatedProfile));
      // Step 2: Add New Address — commented out; go Home direct
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: "ProfileAddressOnboardingScreen" }],
      // });
      navigation.reset({
        index: 0,
        routes: [{ name: "DrawerNavigator" }],
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not save profile",
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
            title="Complete Your Profile"
            currentStep={CURRENT_STEP}
            totalSteps={TOTAL_STEPS}
            onBack={handleSkip}
          />

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Enter your name"
                placeholderTextColor="rgba(96, 112, 128, 0.5)"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) {
                    setNameError("");
                  }
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor="rgba(96, 112, 128, 0.5)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) {
                    setEmailError("");
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>
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
          {/* <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip for Now</Text>
          </TouchableOpacity> */}
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
  form: {
    gap: SPACING.xxl,
    marginTop: SPACING.sm,
  },
  fieldGroup: {
    gap: SPACING.sm,
  },
  label: {
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
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.error,
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
