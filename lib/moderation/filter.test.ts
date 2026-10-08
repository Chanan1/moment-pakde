import { describe, it, expect } from "vitest";
import { detectPII, detectURL, inspectConfess } from "./filter";

describe("detectPII", () => {
  it("harus mendeteksi nomor handphone Indonesia berbagai format", () => {
    expect(detectPII("hubungi aku di 081234567890 ya").hasPII).toBe(true);
    expect(detectPII("wa: +62 812-3456-7890").hasPII).toBe(true);
    expect(detectPII("telp: 6289876543210").hasPII).toBe(true);
    expect(detectPII("nomorku 0812.3456.7890").hasPII).toBe(true);
  });

  it("harus mendeteksi email", () => {
    const result = detectPII("kirim cv ke intern@perusahaan.com");
    expect(result.hasPII).toBe(true);
    expect(result.type).toBe("email");
  });

  it("harus mendeteksi NIK 16 digit", () => {
    const result = detectPII("NIK-nya 3201012345670001");
    expect(result.hasPII).toBe(true);
    expect(result.type).toBe("nik");
  });

  it("tidak boleh menandai teks normal tanpa PII", () => {
    const result = detectPII("makasih buat mentor divisi IT hari ini seru banget");
    expect(result.hasPII).toBe(false);
  });
});

describe("detectURL", () => {
  it("harus mendeteksi format url biasa dan domain", () => {
    expect(detectURL("cek ini https://example.com/test")).toBe(true);
    expect(detectURL("buka www.maganghub.id")).toBe(true);
    expect(detectURL("klik loker.xyz sekarang")).toBe(true);
  });

  it("tidak boleh menandai teks tanpa link", () => {
    expect(detectURL("hari ini makan siang bareng anak marketing")).toBe(false);
  });
});

describe("inspectConfess", () => {
  it("harus menolak bila ada nomor HP atau data pribadi", () => {
    const res = inspectConfess("Halo manis wa aku ya 081234567890");
    expect(res.hasPII).toBe(true);
    expect(res.shouldHold).toBe(true);
  });

  it("harus menahan (shouldHold: true) jika mengandung link atau kata spam/judi", () => {
    const res = inspectConfess("info slot gacor hari ini link di bit.ly/test");
    expect(res.hasPII).toBe(false);
    expect(res.shouldHold).toBe(true);
    expect(res.holdReasons).toContain("spam");
  });

  it("harus meloloskan (shouldHold: false) dengan flag ringan jika ada mention atau kata kasar", () => {
    const res = inspectConfess("kemarin ketemu @intern_cantik tapi anjir malu banget");
    expect(res.hasPII).toBe(false);
    expect(res.shouldHold).toBe(false); // langsung tampil
    expect(res.lightFlags).toContain("mention");
    expect(res.lightFlags).toContain("profanity");
  });

  it("harus langsung tayang bersih tanpa flag untuk pesan wajar", () => {
    const res = inspectConfess("Makasih kak mentor udah sabar ngajarin aku selama 3 bulan ini!");
    expect(res.hasPII).toBe(false);
    expect(res.shouldHold).toBe(false);
    expect(res.allFlags).toEqual([]);
  });
});
