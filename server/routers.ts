import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import {
  clearAdminCookie,
  clearLoginAttempts,
  createAdminSessionToken,
  getClientIp,
  isLoginLocked,
  recordFailedLogin,
  setAdminCookie,
  verifyAdminCredentials,
} from "./adminAuth";

// Keep this in sync with `bookingStatusEnum` in drizzle/schema.ts.
const bookingStatusValues = ["pending", "confirmed", "completed", "cancelled"] as const;

export const appRouter = router({
  system: systemRouter,

  admin: router({
    login: publicProcedure
      .input(
        z.object({
          username: z.string().trim().min(1).max(100),
          password: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const ip = getClientIp(ctx.req);

        if (isLoginLocked(ip)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.",
          });
        }

        const ok = await verifyAdminCredentials(input.username, input.password);
        if (!ok) {
          recordFailedLogin(ip);
          // Deliberately generic — never reveal whether the username or the
          // password was the part that was wrong.
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos." });
        }

        clearLoginAttempts(ip);
        const token = await createAdminSessionToken();
        setAdminCookie(ctx.req, ctx.res, token);
        return { success: true } as const;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      clearAdminCookie(ctx.req, ctx.res);
      return { success: true } as const;
    }),

    me: publicProcedure.query(({ ctx }) => ctx.user),

    bookings: router({
      list: adminProcedure.query(async () => {
        return db.listAllBookingsForAdmin();
      }),

      updateStatus: adminProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            status: z.enum(bookingStatusValues),
          })
        )
        .mutation(async ({ input }) => {
          try {
            await db.updateBookingStatus(input.id, input.status);
            return { success: true } as const;
          } catch (error) {
            if (error instanceof db.BookingNotFoundError) {
              throw new TRPCError({ code: "NOT_FOUND", message: error.message });
            }
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo actualizar la reserva." });
          }
        }),
    }),
  }),

  bookings: router({
    create: publicProcedure
      .input(z.object({
        serviceId: z.number().int().positive(),
        barberId: z.number().int().positive(),
        clientName: z.string().trim().min(2, "El nombre es muy corto").max(100),
        clientEmail: z.string().trim().toLowerCase().email("Correo inválido").max(255),
        clientPhone: z
          .string()
          .trim()
          .regex(/^[0-9+\s()-]{7,20}$/, "Teléfono inválido"),
        appointmentDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (formato YYYY-MM-DD)"),
        appointmentTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (formato HH:MM)"),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.createBooking({
            serviceId: input.serviceId,
            barberId: input.barberId,
            clientName: input.clientName,
            clientEmail: input.clientEmail,
            clientPhone: input.clientPhone,
            appointmentDate: input.appointmentDate,
            appointmentTime: input.appointmentTime,
            status: 'pending',
          });
          return { success: true, message: 'Cita reservada exitosamente' };
        } catch (error) {
          if (error instanceof db.BookingConflictError) {
            throw new TRPCError({ code: 'CONFLICT', message: error.message });
          }
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error al crear la reserva' });
        }
      }),
    getByDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        return db.getBookingsByDate(input.date);
      }),
  }),
  services: router({
    list: publicProcedure.query(async () => {
      return db.getAllServices();
    }),
  }),
  barbers: router({
    list: publicProcedure.query(async () => {
      return db.getAllBarbers();
    }),
  }),
});

export type AppRouter = typeof appRouter;
