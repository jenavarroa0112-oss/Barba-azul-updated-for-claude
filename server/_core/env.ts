export const ENV = {
  /** Secret used to sign/verify the admin session JWT. Must be set in production. */
  jwtSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  /** Single-admin credentials for the booking panel — see server/adminAuth.ts. */
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  /** Format: "<saltHex>:<hashHex>" — generate with scripts/hash-password.mjs. Never a plaintext password. */
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
};
