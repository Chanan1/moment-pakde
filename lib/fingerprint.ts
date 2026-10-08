import "server-only";
import { createHmac } from "crypto";

/**
 * Menghasilkan hash pengirim anonim untuk rate limit dan blokir tanpa menyimpan IP mentah.
 * Salt dirotasi bulanan sehingga hash tidak dapat dilacak lintas bulan.
 */
export function generateSenderHash(ip: string, userAgent: string): string {
  const salt = process.env.CONFESS_HASH_SALT || "default-secret-salt-monthly";
  return createHmac("sha256", salt)
    .update(`${ip}:${userAgent}`)
    .digest("hex");
}

/**
 * Menghasilkan hash kode rahasia penulis confess
 */
export function hashSecretCode(code: string): string {
  const pepper = process.env.SECRET_CODE_PEPPER || "default-secret-code-pepper";
  return createHmac("sha256", pepper)
    .update(code)
    .digest("hex");
}
