import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { ScreenHeader } from "../../components/ui";

export default function ReferDriverScreen() {
  const navigation = useNavigation();

  const referralCode = "GORDR12345";

  const onCopyCode = () => {
    Alert.alert(
      "Referral Code",
      `${referralCode}\n\nCopy functionality can be connected later.`,
    );
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `🚗 Become a GoR Driver Partner and earn more!\n\nUse my referral code: ${referralCode}\n\nComplete onboarding and start earning today.`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <ScreenHeader title="Refer Driver" />

        {/* Hero Banner */}
        <LinearGradient
          colors={COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Ionicons name="car-sport-outline" size={56} color="#FFF" />

          <Text style={styles.heroTitle}>Earn $500 Per Driver</Text>

          <Text style={styles.heroSubtitle}>
            Invite drivers to join GoR and earn rewards when they complete their
            onboarding and start driving.
          </Text>
        </LinearGradient>

        {/* Referral Code */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode}</Text>

            <TouchableOpacity onPress={onCopyCode}>
              <Ionicons name="copy-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onShare}>
            <LinearGradient
              colors={COLORS.gradient}
              style={styles.shareButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="share-social-outline" size={20} color="#FFF" />

              <Text style={styles.shareButtonText}>Invite Driver</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Benefits */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Why Join GoR?</Text>

          <BenefitItem text="Higher earnings opportunities" />
          <BenefitItem text="Flexible working hours" />
          <BenefitItem text="Weekly payouts" />
          <BenefitItem text="Low commission rates" />
          <BenefitItem text="24×7 driver support" />
        </View>

        {/* How It Works */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <StepItem number="1" text="Share your referral code" />

          <StepItem number="2" text="Driver signs up using your code" />

          <StepItem number="3" text="Driver completes verification" />

          <StepItem number="4" text="Driver starts taking rides" />

          <StepItem number="5" text="You receive $500 reward" />
        </View>

        {/* Reward Info */}
        <View style={styles.rewardCard}>
          <Ionicons name="gift-outline" size={24} color={COLORS.primary} />

          <Text style={styles.rewardText}>
            Reward will be credited after the referred driver completes the
            required onboarding and ride criteria.
          </Text>
        </View>

        {/* Terms */}
        <TouchableOpacity style={styles.termsRow}>
          <Text style={styles.termsText}>View Terms & Conditions</Text>

          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const BenefitItem = ({ text }: { text: string }) => (
  <View style={styles.benefitRow}>
    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />

    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const StepItem = ({ number, text }: { number: string; text: string }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepCircle}>
      <Text style={styles.stepNumber}>{number}</Text>
    </View>

    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },

  headerTitle: {
    fontSize: 22,
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  heroCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 20,
  },

  heroTitle: {
    color: "#FFF",
    fontSize: 26,
    marginTop: 12,
    fontFamily: FONTS.bold,
  },

  heroSubtitle: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontFamily: FONTS.medium,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  codeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",

    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  codeText: {
    fontSize: 24,
    letterSpacing: 2,
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },

  shareButton: {
    marginTop: 16,
    height: 52,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  shareButtonText: {
    color: "#FFF",
    marginLeft: 8,
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  benefitText: {
    marginLeft: 10,
    color: COLORS.black,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,
  },

  stepNumber: {
    color: "#FFF",
    fontFamily: FONTS.bold,
  },

  stepText: {
    flex: 1,
    color: COLORS.black,
    fontFamily: FONTS.medium,
  },

  rewardCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,

    flexDirection: "row",
    alignItems: "flex-start",

    marginBottom: 18,
  },

  rewardText: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.text,
    lineHeight: 20,
    fontFamily: FONTS.medium,
  },

  termsRow: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  termsText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});
