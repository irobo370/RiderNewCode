const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  hi: "Hindi",
};

export function getLanguageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? "English";
}

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
] as const;
