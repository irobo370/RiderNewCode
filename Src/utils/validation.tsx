import { getActiveCountry } from "../constants/locale";

export const validatePhone = (phone: String) => {
  let cleaned = phone.replace(/\D/g, "");
  const country = getActiveCountry();

  // Allow domestic trunk 0 (081…)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length === 0) {
    return "Mobile number is required";
  }

  if (cleaned.length < country.phoneLocalDigits) {
    return `Enter a valid ${country.name} mobile number`;
  }

  return "";
};

export const validateEmail = (email: string) => {
  const trimmed = email.trim();

  if (!trimmed) {
    return "Email address is required";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address";
  }

  return "";
};
