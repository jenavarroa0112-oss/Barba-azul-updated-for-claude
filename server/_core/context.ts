import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, type AdminSession } from "../adminAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AdminSession | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
  const token = cookies[ADMIN_COOKIE_NAME];
  const user = await verifyAdminSessionToken(token);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
