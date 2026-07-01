import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  ADMIN_COOKIE_NAME,
  clearLoginAttempts,
  hashPassword,
  isLoginLocked,
  recordFailedLogin,
  verifyPassword,
} from "./adminAuth";

type CookieCall = { name: string; options: Record<string, unknown> };

function createCtx(user: TrpcContext["user"]): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {}, ip: "203.0.113.1" } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("password hashing", () => {
  it("accepts the correct password", async () => {
    const stored = await hashPassword("a-very-long-correct-password");
    expect(await verifyPassword("a-very-long-correct-password", stored)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("a-very-long-correct-password");
    expect(await verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    expect(await verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });
});

describe("login throttling", () => {
  it("locks an IP after 5 failed attempts and not before", () => {
    const ip = "198.51.100.7";
    clearLoginAttempts(ip);
    for (let i = 0; i < 5; i++) {
      expect(isLoginLocked(ip)).toBe(false);
      recordFailedLogin(ip);
    }
    expect(isLoginLocked(ip)).toBe(true);
    clearLoginAttempts(ip);
    expect(isLoginLocked(ip)).toBe(false);
  });

  it("does not lock an unrelated IP", () => {
    expect(isLoginLocked("203.0.113.99")).toBe(false);
  });
});

describe("admin.logout", () => {
  it("clears the admin session cookie with strict, httpOnly options", async () => {
    const { ctx, clearedCookies } = createCtx({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(ADMIN_COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: -1,
    });
  });
});

describe("access control", () => {
  it("rejects admin.bookings.list when there is no session", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.bookings.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admin.bookings.list when the session role is admin", async () => {
    const { ctx } = createCtx({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    // No DATABASE_URL in the test environment, so this resolves to an empty
    // list rather than connecting anywhere — the point here is that the
    // access-control gate lets it through instead of throwing FORBIDDEN.
    await expect(caller.admin.bookings.list()).resolves.toEqual([]);
  });
});

describe("input validation rejects malformed / injection-shaped input before it reaches the database", () => {
  it("rejects a non-numeric booking id", async () => {
    const { ctx } = createCtx({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.bookings.updateStatus({
        // @ts-expect-error deliberately wrong type, simulating a hostile client
        id: "1 OR 1=1",
        status: "pending",
      })
    ).rejects.toBeDefined();
  });

  it("rejects an unknown status value", async () => {
    const { ctx } = createCtx({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.bookings.updateStatus({
        id: 1,
        // @ts-expect-error deliberately invalid enum value
        status: "pending'); DROP TABLE bookings;--",
      })
    ).rejects.toBeDefined();
  });

  it("rejects a booking with a SQL-injection-shaped phone number", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.bookings.create({
        serviceId: 1,
        barberId: 1,
        clientName: "Test",
        clientEmail: "test@example.com",
        clientPhone: "'); DROP TABLE bookings;--",
        appointmentDate: "2026-07-01",
        appointmentTime: "10:00",
      })
    ).rejects.toBeDefined();
  });
});
