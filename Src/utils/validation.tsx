import { APP_COUNTRY_NAME, PHONE_LOCAL_DIGITS } from "../constants/locale";

export const validatePhone = (phone: String) => {
  let cleaned = phone.replace(/\D/g, "");

  // Allow domestic trunk 0 (081…)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length === 0) {
    return "Mobile number is required";
  }

  if (cleaned.length < PHONE_LOCAL_DIGITS) {
    return `Enter a valid ${APP_COUNTRY_NAME} mobile number`;
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
