import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { RADIUS, SPACING } from "../../utils/spacing";

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
  onSubmit?: () => void;
  editable?: boolean;
  showNavigateIcon?: boolean;
  style?: ViewStyle;
  inputProps?: TextInputProps;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = "Search destination",
  onPress,
  onSubmit,
  editable = true,
  showNavigateIcon = true,
  style,
  inputProps,
}: SearchFieldProps) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <Ionicons name="search" size={20} color={COLORS.text} />
      </TouchableOpacity>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        editable={editable}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        onFocus={onPress}
        {...inputProps}
      />

      {showNavigateIcon && (
        <TouchableOpacity onPress={onSubmit ?? onPress}>
          <Ionicons name="navigate-circle" size={24} color={COLORS.black} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.search,
    paddingHorizontal: 14,
    height: 58,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  input: {
    flex: 1,
    marginHorizontal: SPACING.sm + 2,
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.black,
  },
});
