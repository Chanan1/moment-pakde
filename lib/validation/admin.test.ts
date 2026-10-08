import { describe, it, expect } from "vitest";
import {
  ModerateConfessSchema,
  ResolveReportSchema,
  BlockSenderSchema,
  TogglePauseSchema,
} from "./admin";

describe("Admin Validation Schemas", () => {
  it("validates ModerateConfessSchema correctly", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";
    const res = ModerateConfessSchema.safeParse({
      id: validUuid,
      action: "hide",
      reason: "Mengandung kata kasar",
    });
    expect(res.success).toBe(true);

    const invalidAction = ModerateConfessSchema.safeParse({
      id: validUuid,
      action: "random_action",
    });
    expect(invalidAction.success).toBe(false);

    const invalidUuid = ModerateConfessSchema.safeParse({
      id: "not-a-uuid",
      action: "publish",
    });
    expect(invalidUuid.success).toBe(false);
  });

  it("validates ResolveReportSchema correctly", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";
    const res = ResolveReportSchema.safeParse({
      reportId: validUuid,
      action: "dismiss",
      note: "Laporan tidak beralasan",
    });
    expect(res.success).toBe(true);

    const invalid = ResolveReportSchema.safeParse({
      reportId: validUuid,
      action: "ignore",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates BlockSenderSchema correctly", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";
    const res = BlockSenderSchema.safeParse({
      confessionId: validUuid,
      days: 30,
      reason: "Spam berulang",
    });
    expect(res.success).toBe(true);

    const invalidDays = BlockSenderSchema.safeParse({
      confessionId: validUuid,
      days: -5,
    });
    expect(invalidDays.success).toBe(false);
  });

  it("validates TogglePauseSchema correctly", () => {
    expect(TogglePauseSchema.safeParse({ paused: true }).success).toBe(true);
    expect(TogglePauseSchema.safeParse({ paused: false }).success).toBe(true);
    expect(TogglePauseSchema.safeParse({ paused: "true" }).success).toBe(false);
  });
});
