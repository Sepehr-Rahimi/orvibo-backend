type slugifyMixedOptions = {
  lower?: boolean;
  convertDigits?: boolean;
  allowUnderscore?: boolean;
};

/**
 * slugifyMixed(text, options)
 *
 * Keeps Persian (Arabic script) and English, normalizes Persian variants,
 * converts Persian digits -> ASCII (optional), removes diacritics,
 * replaces unsafe characters with '-' and collapses repeated hyphens.
 *
 * options:
 *   lower: boolean (default true)      -> lowercases the result (affects Latin only)
 *   convertDigits: boolean (default true) -> convert Persian/Arabic digits to ASCII
 *   allowUnderscore: boolean (default false) -> allow '_' in result
 */
export function slugifyMixed(input: string, options: slugifyMixedOptions = {}) {
  const {
    lower = true,
    convertDigits = true,
    allowUnderscore = false,
  } = options;
  if (typeof input !== "string") return "";

  // 1) Normalize common Persian/Arabic letter variants
  let s = input
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ڤ/g, "و") // optional mapping
    .replace(/ۀ/g, "ه")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ی")
    .replace(/\u200C/g, " ") // zero-width non-joiner -> space
    .trim();

  // 2) Remove Arabic diacritics/tashkeel (vowel marks)
  // Unicode range \u064B - \u065F and others used for Arabic diacritics
  s = s.replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED]/g, "");

  // 3) Convert Persian/Arabic digits to ASCII digits (0-9)
  if (convertDigits) {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
    s = s.replace(/[\u06F0-\u06F9]/g, (ch) =>
      String(persianDigits.indexOf(ch))
    );
    s = s.replace(/[\u0660-\u0669]/g, (ch) =>
      String(arabicIndicDigits.indexOf(ch))
    );
  }

  // 4) Build allowed-character regex.
  // Prefer Unicode property escapes if available; otherwise fallback to explicit ranges.
  let allowedRe;
  try {
    // This uses \p{Script=Arabic} and \p{Script=Latin} to allow both scripts
    const extra = allowUnderscore ? "_" : "";
    allowedRe = new RegExp(
      `[^\\p{Script=Arabic}\\p{Script=Latin}\\p{Nd}${extra}]+`,
      "gu"
    );
  } catch (e) {
    // Fallback ranges for engines that don't support \p{} (older Node)
    // Arabic/Persian ranges: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF
    const extra = allowUnderscore ? "_" : "";
    allowedRe = new RegExp(
      `[^A-Za-z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF${extra}]+`,
      "g"
    );
  }

  // 5) Replace sequences of disallowed chars with hyphen
  s = s.replace(allowedRe, "-");

  // 6) Collapse multiple hyphens, trim leading/trailing hyphens
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");

  // 7) Lowercase if requested (this won't break Persian letters)
  if (lower) s = s.toLowerCase();

  return s;
}
