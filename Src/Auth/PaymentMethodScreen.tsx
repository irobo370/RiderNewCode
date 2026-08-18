import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { ScreenHeader } from "../components/ui";

export default function PaymentMethodScreen() {
  const navigation = useNavigation();

  const [showAddCard, setShowAddCard] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [zipCode, setZipCode] = useState("");

  const cards = [
    {
      id: 1,
      type: "Visa",
      number: "**** **** **** 4242",
      expiry: "12/27",
      default: true,
    },
    {
      id: 2,
      type: "Mastercard",
      number: "**** **** **** 8821",
      expiry: "08/28",
      default: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}

      <ScreenHeader title="Payment Methods" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={styles.sectionTitle}>Saved Cards</Text>

        {cards.map((card) => (
          <View key={card.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.brandContainer}>
                <FontAwesome5
                  name="credit-card"
                  size={18}
                  color={COLORS.primary}
                />

                <Text style={styles.cardBrand}>{card.type}</Text>
              </View>

              {card.default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>

            <Text style={styles.cardNumber}>{card.number}</Text>

            <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
          </View>
        ))}

        {/* DIGITAL PAYMENT */}

        <Text style={styles.sectionTitle}>Other Payment Methods</Text>

        <View style={styles.optionCard}>
          <Ionicons
            name="phone-portrait-outline"
            size={22}
            color={COLORS.primary}
          />

          <Text style={styles.optionText}>Apple Pay</Text>
        </View>

        <View style={styles.optionCard}>
          <Ionicons name="wallet-outline" size={22} color={COLORS.primary} />

          <Text style={styles.optionText}>PayPal</Text>
        </View>
      </ScrollView>

      {/* ADD BUTTON */}

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowAddCard(true)}
        >
          <LinearGradient colors={COLORS.gradient} style={styles.addButton}>
            {/* <Ionicons name="add" size={20} color="#FFF" /> */}

            <Text style={styles.addButtonText}>Add New Card</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ADD CARD MODAL */}

      <Modal visible={showAddCard} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>

              <TouchableOpacity onPress={() => setShowAddCard(false)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Card Number"
              style={styles.input}
              value={cardNumber}
              onChangeText={setCardNumber}
            />

            <View style={styles.row}>
              <TextInput
                placeholder="MM/YY"
                style={[styles.input, styles.halfInput]}
                value={expiry}
                onChangeText={setExpiry}
              />

              <TextInput
                placeholder="CVV"
                style={[styles.input, styles.halfInput]}
                value={cvv}
                onChangeText={setCvv}
              />
            </View>

            <TextInput
              placeholder="Cardholder Name"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              placeholder="ZIP Code"
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
            />

            <TouchableOpacity activeOpacity={0.9}>
              <LinearGradient colors={COLORS.gradient} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Card</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  headerTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.black,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.black,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 12,
  },

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    borderRadius: 20,
    elevation: 4,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardBrand: {
    marginLeft: 10,
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },

  cardNumber: {
    marginTop: 14,
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.black,
  },

  cardExpiry: {
    marginTop: 6,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },

  defaultBadge: {
    backgroundColor: "#E8F8EF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  defaultText: {
    color: "#0A8A42",
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },

  optionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  optionText: {
    marginLeft: 12,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },

  bottomContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },

  addButton: {
    height: 56,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    color: "#FFF",
    marginLeft: 8,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 14,
    fontFamily: FONTS.medium,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  halfInput: {
    width: "48%",
  },

  saveBtn: {
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
});
