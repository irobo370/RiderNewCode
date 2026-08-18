import {
  COUNTRY_CODE,
  PHONE_LOCAL_DIGITS,
} from "../constants/locale";
import { ACTIVE_COUNTRY } from "../constants/countries";

/** Normalize local input to E.164. Strips a leading domestic trunk 0. */
export function toE164Phone(localDigits: string): string {
  let digits = localDigits.replace(/\D/g, "");
  const dialDigits = ACTIVE_COUNTRY.dialCodeDigits;

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (
    digits.startsWith(dialDigits) &&
    digits.length === dialDigits.length + PHONE_LOCAL_DIGITS
  ) {
    return `+${digits}`;
  }

  return `${COUNTRY_CODE}${digits.slice(0, PHONE_LOCAL_DIGITS)}`;
}

/** Display helper using the active country's dial code + digit groups. */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const dialDigits = ACTIVE_COUNTRY.dialCodeDigits;

  let local = digits;
  if (local.startsWith(dialDigits)) {
    local = local.slice(dialDigits.length);
  }
  if (local.startsWith("0")) {
    local = local.slice(1);
  }
  local = local.slice(0, PHONE_LOCAL_DIGITS);

  if (local.length === PHONE_LOCAL_DIGITS) {
    const groups = ACTIVE_COUNTRY.phoneDisplayGroups;
    const parts: string[] = [];
    let cursor = 0;
    for (const size of groups) {
      parts.push(local.slice(cursor, cursor + size));
      cursor += size;
    }
    if (cursor < local.length) {
      parts.push(local.slice(cursor));
    }
    return `${COUNTRY_CODE} ${parts.filter(Boolean).join(" ")}`;
  }

  if (phone.startsWith("+")) {
    return phone;
  }

  return `${COUNTRY_CODE} ${phone}`;
}
