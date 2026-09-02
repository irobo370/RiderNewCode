import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  listMarketCountries,
  type CountryConfig,
  type CountryId,
} from "../constants/countries";
import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { RADIUS, SPACING } from "../utils/spacing";

type CountryCodePickerProps = {
  visible: boolean;
  selectedId: CountryId;
  onSelect: (countryId: CountryId) => void;
  onClose: () => void;
};

export default function CountryCodePicker({
  visible,
  selectedId,
  onSelect,
  onClose,
}: CountryCodePickerProps) {
  const countries = listMarketCountries();

  const handleSelect = (country: CountryConfig) => {
    onSelect(country.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Select country</Text>
          <Text style={styles.subtitle}>
            Phone code, search results, and map region follow this country
          </Text>

          {countries.map((country) => {
            const selected = country.id === selectedId;
            return (
              <TouchableOpacity
                key={country.id}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => handleSelect(country)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{country.pickerLabel}</Text>
                  <Text style={styles.rowSubtitle}>{country.city}</Text>
                </View>
                <Text style={styles.dialCode}>{country.dialCode}</Text>
                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={COLORS.primary}
                    style={styles.check}
                  />
                ) : (
                  <View style={styles.checkPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -8 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(96, 112, 128, 0.25)",
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: "#1F1F1F",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
    color: "#6C7278",
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  rowSelected: {
    backgroundColor: "rgba(7, 115, 222, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(7, 115, 222, 0.25)",
  },
  rowCopy: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  rowTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: "#1F1F1F",
  },
  rowSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: "#6C7278",
    marginTop: 2,
  },
  dialCode: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.primary,
    marginRight: 8,
  },
  check: {
    marginLeft: 2,
  },
  checkPlaceholder: {
    width: 22,
    height: 22,
  },
});
