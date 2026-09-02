import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { ScreenHeader } from "../components/ui";
import { formatPhoneDisplay } from "../utils/phoneFormat";
import { getActiveCountry } from "../constants/locale";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const market = getActiveCountry();

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("Krishna Sharma");
  const [email, setEmail] = useState("krishna@gmail.com");
  const [phone, setPhone] = useState(formatPhoneDisplay(market.supportPhone));
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState(market.defaultDevAddress);
  const [emergencyContact, setEmergencyContact] = useState(
    formatPhoneDisplay(market.supportPhone),
  );

  const [showGenderOptions, setShowGenderOptions] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}

      <ScreenHeader title="Edit Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        {/* Profile Image */}

        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: "https://randomuser.me/api/portraits/men/32.jpg",
              }}
              style={styles.avatar}
            />

            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{name}</Text>

          <Text style={styles.memberSince}>Member since Jan 2024</Text>
        </View>

        {/* Form */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Name */}

          <Text style={styles.label}>Full Name</Text>

          <TextInput
            style={styles.input}
            editable={isEditing}
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
          />

          {/* Email */}

          <Text style={styles.label}>Email Address</Text>

          <TextInput
            style={styles.input}
            editable={isEditing}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter email"
          />

          {/* Phone */}

          <Text style={styles.label}>Mobile Number</Text>

          <TextInput
            style={styles.input}
            editable={isEditing}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter mobile number"
          />

          {/* Gender */}

          <Text style={styles.label}>Gender</Text>

          <TouchableOpacity
            disabled={!isEditing}
            style={styles.dropdown}
            onPress={() => setShowGenderOptions(!showGenderOptions)}
          >
            <Text
              style={[
                styles.dropdownText,
                !gender && {
                  color: COLORS.textLight,
                },
              ]}
            >
              {gender || "Select Gender"}
            </Text>

            <Ionicons
              name={showGenderOptions ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          {showGenderOptions && isEditing && (
            <View style={styles.dropdownMenu}>
              {["Male", "Female", "Other"].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setGender(item);
                    setShowGenderOptions(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Emergency Contact */}

          <Text style={styles.label}>Emergency Contact</Text>

          <TextInput
            style={styles.input}
            editable={isEditing}
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            keyboardType="phone-pad"
            placeholder="Emergency contact"
          />

          {/* Address */}

          <Text style={styles.label}>Address</Text>

          <TextInput
            style={styles.addressInput}
            editable={isEditing}
            value={address}
            onChangeText={setAddress}
            multiline
            textAlignVertical="top"
            placeholder="Enter address"
          />
        </View>

        {/* Button */}

        {!isEditing ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setIsEditing(true)}
          >
            <LinearGradient colors={COLORS.gradient} style={styles.button}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setIsEditing(false);

              // API call here
              console.log("Profile Updated");
            }}
          >
            <LinearGradient colors={COLORS.gradient} style={styles.button}>
              <Text style={styles.buttonText}>Update Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  userName: {
    marginTop: 12,
    fontSize: 22,
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  memberSince: {
    marginTop: 4,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 5,
  },

  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  label: {
    marginBottom: 6,
    color: COLORS.black,
    fontFamily: FONTS.medium,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    backgroundColor: COLORS.white,
    marginBottom: 15,
    fontFamily: FONTS.medium,
    color: COLORS.black,
  },

  addressInput: {
    height: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 15,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.medium,
    color: COLORS.black,
  },

  dropdown: {
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: COLORS.white,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    color: COLORS.black,
    fontFamily: FONTS.medium,
  },

  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },

  dropdownItemText: {
    color: COLORS.black,
    fontFamily: FONTS.medium,
  },

  button: {
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
});
