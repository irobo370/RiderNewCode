import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { RADIUS, SPACING } from "../../utils/spacing";
import { ScreenHeader } from "../../components/ui";

export default function ReferFriendScreen() {
  const navigation = useNavigation();

  const referralCode = "GOR12345";

  const onShare = async () => {
    try {
      await Share.share({
        message: `🚖 Join GoR using my referral code ${referralCode} and get $100 OFF on your first ride!\n\nDownload now and start riding.`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert("Copied", "Referral code copied successfully");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <ScreenHeader title="Refer & Earn" />

        {/* Banner */}
        <LinearGradient
          colors={COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <Ionicons name="gift-outline" size={50} color="#FFF" />

          <Text style={styles.bannerTitle}>Earn $100 Per Friend</Text>

          <Text style={styles.bannerSubtitle}>
            Invite your friends and earn rewards when they complete their first
            ride.
          </Text>
        </LinearGradient>

        {/* Referral Code Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralCode}</Text>

            <TouchableOpacity onPress={copyCode}>
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

        {/* How it Works */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How it works</Text>

          <Step number="1" text="Share your referral code" />

          <Step number="2" text="Friend signs up using your code" />

          <Step number="3" text="Friend completes first ride" />

          <Step number="4" text="You receive $100 reward" />
        </View>

        {/* Terms */}
        <TouchableOpacity style={styles.termsButton}>
          <Text style={styles.termsText}>View Terms & Conditions</Text>

          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const Step = ({ number, text }: { number: string; text: string }) => {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>

      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 22,
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  banner: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },

  bannerTitle: {
    color: "#FFF",
    fontSize: 24,
    marginTop: 12,
    fontFamily: FONTS.bold,
  },

  bannerSubtitle: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 8,
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

  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.primary,

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

  // shareButton: {
  //   marginTop: 16,
  //   backgroundColor: COLORS.primary,

  //   height: 52,
  //   borderRadius: 30,

  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
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

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,

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
    fontSize: 15,
    fontFamily: FONTS.medium,
  },

  termsButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  termsText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
});
