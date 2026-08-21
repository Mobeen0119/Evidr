export interface ScriptCheck {
  isNonLatin: boolean;
  scriptName?: string;
}

const RANGES: { name: string; test: RegExp }[] = [
  { name: "Arabic or Urdu", test: /[\u0600-\u06FF\u0750-\u077F]/ },
  { name: "Devanagari (Hindi)", test: /[\u0900-\u097F]/ },
  { name: "Chinese", test: /[\u4E00-\u9FFF]/ },
  { name: "Cyrillic (Russian)", test: /[\u0400-\u04FF]/ },
  { name: "Bengali", test: /[\u0980-\u09FF]/ },
  { name: "Japanese", test: /[\u3040-\u30FF]/ },
  { name: "Korean", test: /[\uAC00-\uD7AF]/ },
  { name: "Thai", test: /[\u0E00-\u0E7F]/ }
];

const ROMAN_URDU_HINDI_WORDS = new Set([
  "hota", "hoti", "hote", "hai", "hain", "tha", "thi", "the", "kya", "kyun", "kyu", "kaise", "kahan",
  "kar", "karo", "karta", "karti", "kartay", "nahi", "nahin", "nhi", "wala", "wali", "walay",
  "acha", "achha", "bura", "bahut", "bohat", "zyada", "kam", "abhi", "yeh", "yah", "voh", "woh",
  "mera", "meri", "mere", "tera", "teri", "apna", "apni", "hum", "tum", "aap", "unka", "uska",
  "se", "ko", "ka", "ki", "ke", "mein", "pe", "par", "din", "raat", "ghar", "log", "cheez",
  "sach", "jhoot", "jhooth", "pata", "malum", "matlab", "sirf", "bilkul"
]);

export function detectRomanUrduHindi(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 3) return false;
  const hits = words.filter((w) => ROMAN_URDU_HINDI_WORDS.has(w)).length;
  return hits >= 2;
}

export function detectNonLatinScript(text: string): ScriptCheck {
  for (const range of RANGES) {
    if (range.test.test(text)) return { isNonLatin: true, scriptName: range.name };
  }
  if (detectRomanUrduHindi(text)) return { isNonLatin: true, scriptName: "Roman Urdu/Hindi" };
  return { isNonLatin: false };
}
