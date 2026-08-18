import { FONTS } from "./fonts";

export const TYPO = {
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: FONTS.bold,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FONTS.bold,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: FONTS.bold,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: FONTS.bold,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.medium,
  },
  bodySm: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.medium,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONTS.medium,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  button: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  section: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: FONTS.semiBold,
  },
} as const;
