import { z } from "zod";

export const ModerateConfessSchema = z.object({
  id: z.string().uuid({ message: "ID confess tidak valid" }),
  action: z.enum(["review", "publish", "hide", "restore", "remove"], {
    message: "Aksi moderasi tidak valid",
  }),
  reason: z.string().max(300, { message: "Alasan maksimal 300 karakter" }).optional(),
});

export const ResolveReportSchema = z.object({
  reportId: z.string().uuid({ message: "ID laporan tidak valid" }),
  action: z.enum(["dismiss", "hide", "remove"], {
    message: "Aksi laporan tidak valid",
  }),
  note: z.string().max(300, { message: "Catatan maksimal 300 karakter" }).optional(),
});

export const BlockSenderSchema = z.object({
  confessionId: z.string().uuid({ message: "ID confess tidak valid" }),
  days: z.number().int().min(1).max(365).optional(),
  reason: z.string().max(300, { message: "Alasan maksimal 300 karakter" }).optional(),
});

export const TogglePauseSchema = z.object({
  paused: z.boolean(),
});

export type ModerateConfessInput = z.infer<typeof ModerateConfessSchema>;
export type ResolveReportInput = z.infer<typeof ResolveReportSchema>;
export type BlockSenderInput = z.infer<typeof BlockSenderSchema>;
