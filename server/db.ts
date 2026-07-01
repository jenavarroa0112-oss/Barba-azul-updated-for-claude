import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertBooking,
  bookings,
  bookingStatusEnum,
  services,
  barbers,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];

/** Thrown when a booking slot is already taken. routers.ts maps this to a friendly TRPCError. */
export class BookingConflictError extends Error {
  constructor(message = "Ese horario ya está reservado para este barbero.") {
    super(message);
    this.name = "BookingConflictError";
  }
}

/** Thrown when an admin action targets a booking id that doesn't exist. */
export class BookingNotFoundError extends Error {
  constructor(message = "Esa reserva no existe.") {
    super(message);
    this.name = "BookingNotFoundError";
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Supabase's pooled connection (port 6543, pgbouncer in "transaction" mode)
      // does not support prepared statements, so we disable them here. This is
      // safe and recommended even against the direct (port 5432) connection.
      const client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services);
}

export async function getAllBarbers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(barbers).where(eq(barbers.isActive, true));
}

/**
 * Creates a booking after checking the requested slot is still free.
 *
 * Two layers of protection against double-booking:
 *  1. Application-level check right here (covers the common case, gives a
 *     fast friendly error).
 *  2. The `bookings_barber_slot_unique` index in the schema (covers the rare
 *     race where two requests for the same slot land at almost the same time
 *     — Postgres rejects the second INSERT and we translate that into the
 *     same BookingConflictError below).
 */
export async function createBooking(booking: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.barberId, booking.barberId),
        eq(bookings.appointmentDate, booking.appointmentDate),
        eq(bookings.appointmentTime, booking.appointmentTime)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new BookingConflictError();
  }

  try {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  } catch (error) {
    // Postgres unique_violation error code — last line of defense against races.
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "23505") {
      throw new BookingConflictError();
    }
    throw error;
  }
}

export async function getBookingsByDate(date: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bookings).where(eq(bookings.appointmentDate, date));
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

/**
 * All bookings, soonest first, with the service/barber name already joined
 * in so the admin panel doesn't have to show raw ids.
 */
export async function listAllBookingsForAdmin() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      clientPhone: bookings.clientPhone,
      appointmentDate: bookings.appointmentDate,
      appointmentTime: bookings.appointmentTime,
      status: bookings.status,
      createdAt: bookings.createdAt,
      serviceName: services.name,
      servicePrice: services.price,
      barberName: barbers.name,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(barbers, eq(bookings.barberId, barbers.id))
    .orderBy(asc(bookings.appointmentDate), asc(bookings.appointmentTime));
}

/** Updates a booking's status. `id` and `status` are both validated by zod in routers.ts before this runs. */
export async function updateBookingStatus(id: number, status: BookingStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  if (result.length === 0) {
    throw new BookingNotFoundError();
  }
  return result[0];
}
