import { z } from "zod";

export const REPORT_REASONS = [
  "spam",
  "bullying",
  "doxxing",
  "company",
  "sexual",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const ReportContentSchema = z.object({
  targetType: z.enum(["moment", "comment", "confession", "reply"]),
  targetId: z.string().uuid("ID target tidak valid"),
  reason: z.enum(REPORT_REASONS, {
    message: "Pilih alasan pelaporan yang valid",
  }),
  note: z.string().max(300, "Catatan maksimal 300 karakter").optional(),
});

export type ReportContentInput = z.infer<typeof ReportContentSchema>;
