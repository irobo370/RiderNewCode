import { getActiveCountry } from "../constants/countries";

/** Normalize local input to E.164. Strips a leading domestic trunk 0. */
export function toE164Phone(localDigits: string): string {
  let digits = localDigits.replace(/\D/g, "");
  const country = getActiveCountry();
  const dialDigits = country.dialCodeDigits;
  const localLength = country.phoneLocalDigits;

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (
    digits.startsWith(dialDigits) &&
    digits.length === dialDigits.length + localLength
  ) {
    return `+${digits}`;
  }

  return `${country.dialCode}${digits.slice(0, localLength)}`;
}

/** Display helper using the active country's dial code + digit groups. */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const country = getActiveCountry();
  const dialDigits = country.dialCodeDigits;
  const localLength = country.phoneLocalDigits;

  let local = digits;
  if (local.startsWith(dialDigits)) {
    local = local.slice(dialDigits.length);
  }
  if (local.startsWith("0")) {
    local = local.slice(1);
  }
  local = local.slice(0, localLength);

  if (local.length === localLength) {
    const groups = country.phoneDisplayGroups;
    const parts: string[] = [];
    let cursor = 0;
    for (const size of groups) {
      parts.push(local.slice(cursor, cursor + size));
      cursor += size;
    }
    if (cursor < local.length) {
      parts.push(local.slice(cursor));
    }
    return `${country.dialCode} ${parts.filter(Boolean).join(" ")}`;
  }

  if (phone.startsWith("+")) {
    return phone;
  }

  return `${country.dialCode} ${phone}`;
}
