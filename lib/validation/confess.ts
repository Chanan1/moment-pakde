import { z } from "zod";

export const CONFESS_CATEGORIES = [
  "naksir",
  "terima_kasih",
  "curhat",
  "minta_maaf",
  "unek_unek",
  "lainnya",
] as const;

export type ConfessCategory = (typeof CONFESS_CATEGORIES)[number];

export const SubmitConfessSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, "Confess minimal 10 karakter ya")
    .max(1000, "Confess maksimal 1000 karakter"),
  recipient: z
    .string()
    .trim()
    .max(60, "Penerima maksimal 60 karakter")
    .optional(),
  category: z.enum(CONFESS_CATEGORIES, {
    message: "Pilih kategori yang valid",
  }),
  turnstileToken: z
    .string()
    .min(1, "Harap selesaikan verifikasi captcha"),
});

export type SubmitConfessInput = z.infer<typeof SubmitConfessSchema>;
