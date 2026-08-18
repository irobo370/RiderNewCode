import { useFonts } from "expo-font";

export const FONTS = {
  regular: "Outfit-Regular",
  medium: "Outfit-Medium",
  semiBold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
  extraBold: "Outfit-ExtraBold",
  light: "Outfit-Light",
  extraLight: "Outfit-ExtraLight",
  thin: "Outfit-Thin",
  black: "Outfit-Black",
};

export default function useCustomFonts() {
  return useFonts({
    "Outfit-Black": require("../../assets/fonts/Outfit-Black.ttf"),
    "Outfit-Bold": require("../../assets/fonts/Outfit-Bold.ttf"),
    "Outfit-ExtraBold": require("../../assets/fonts/Outfit-ExtraBold.ttf"),
    "Outfit-ExtraLight": require("../../assets/fonts/Outfit-ExtraLight.ttf"),
    "Outfit-Light": require("../../assets/fonts/Outfit-Light.ttf"),
    "Outfit-Medium": require("../../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-Regular": require("../../assets/fonts/Outfit-Regular.ttf"),
    "Outfit-SemiBold": require("../../assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Thin": require("../../assets/fonts/Outfit-Thin.ttf"),
  });
}
