import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { COLORS } from "../../utils/colors";
import { RADIUS } from "../../utils/spacing";

type BookingBottomSheetProps = {
  children: React.ReactNode;
  height?: number;
  style?: ViewStyle;
};

export default function BookingBottomSheet({
  children,
  height,
  style,
}: BookingBottomSheetProps) {
  return (
    <View style={[styles.sheet, height != null ? { height } : null, style]}>
      <View style={styles.handle} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: -6 },
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.handle,
    marginBottom: 8,
  },
});
