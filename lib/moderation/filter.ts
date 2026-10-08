import { SPAM_KEYWORDS, PROFANITY_KEYWORDS, SELF_HARM_KEYWORDS } from "./wordlist";

export type PIIType = "phone" | "email" | "nik";

export interface PIIResult {
  hasPII: boolean;
  type?: PIIType;
  matched?: string;
}

export interface ModerationResult {
  hasPII: boolean;
  piiType?: PIIType;
  shouldHold: boolean;
  holdReasons: ("url" | "spam" | "selfharm")[];
  lightFlags: ("mention" | "profanity")[];
  allFlags: string[];
}

/**
 * Normalisasi teks untuk deteksi variasi leetspeak sederhana dan spasi buatan
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t");
}

/**
 * Deteksi Data Pribadi (PII): Nomor HP, Email, NIK
 */
export function detectPII(text: string): PIIResult {
  // 1. Cek Email
  const emailRegex = /\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b/i;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    return { hasPII: true, type: "email", matched: emailMatch[0] };
  }

  // 2. Cek NIK (16 digit berurutan)
  const nikRegex = /\b\d{16}\b/;
  const nikMatch = text.match(nikRegex);
  if (nikMatch) {
    return { hasPII: true, type: "nik", matched: nikMatch[0] };
  }

  // 3. Cek Nomor HP Indonesia (08xxx, 628xxx, +628xxx)
  // Menangani pemisah seperti spasi, tanda strip, atau titik antar digit
  const phoneRegex = /(?:^|[^\d])(?:\+?62|0)[\s.-]?8[1-9](?:[\s.-]?\d){7,10}(?:[^\d]|$)/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    return { hasPII: true, type: "phone", matched: phoneMatch[0].trim() };
  }

  return { hasPII: false };
}

/**
 * Deteksi Link / URL
 */
export function detectURL(text: string): boolean {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z0-9-]+\.(?:com|org|net|id|co\.id|xyz|link|online|top|me|io|info)\b)/i;
  return urlRegex.test(text);
}

/**
 * Deteksi kata kunci dalam teks
 */
function containsKeyword(normalizedText: string, keywords: string[]): boolean {
  return keywords.some((kw) => normalizedText.includes(kw.toLowerCase()));
}

/**
 * Pemeriksaan lengkap moderasi konten confess
 */
export function inspectConfess(text: string): ModerationResult {
  const pii = detectPII(text);
  if (pii.hasPII) {
    return {
      hasPII: true,
      piiType: pii.type,
      shouldHold: true,
      holdReasons: [],
      lightFlags: [],
      allFlags: [pii.type!],
    };
  }

  const normalized = normalizeText(text);
  const holdReasons: ("url" | "spam" | "selfharm")[] = [];
  const lightFlags: ("mention" | "profanity")[] = [];

  // Flag berat (konten ditahan jadi pending)
  if (detectURL(text)) {
    holdReasons.push("url");
  }
  if (containsKeyword(normalized, SPAM_KEYWORDS)) {
    holdReasons.push("spam");
  }
  if (containsKeyword(normalized, SELF_HARM_KEYWORDS)) {
    holdReasons.push("selfharm");
  }

  // Flag ringan (tetap tampil tapi dilaporkan ke tab Perlu Dicek)
  if (/@\w{3,}/.test(text)) {
    lightFlags.push("mention");
  }
  if (containsKeyword(normalized, PROFANITY_KEYWORDS)) {
    lightFlags.push("profanity");
  }

  return {
    hasPII: false,
    shouldHold: holdReasons.length > 0,
    holdReasons,
    lightFlags,
    allFlags: [...holdReasons, ...lightFlags],
  };
}
