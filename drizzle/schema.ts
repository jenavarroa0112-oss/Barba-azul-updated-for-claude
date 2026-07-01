import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bookings table for storing barbershop appointments.
 *
 * The unique index on (barberId, appointmentDate, appointmentTime) is the
 * database-level guarantee against double-booking: even if two requests race
 * past the application-level check in server/db.ts, the second INSERT will
 * fail instead of silently creating a duplicate appointment.
 */
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    serviceId: integer("serviceId").notNull(),
    barberId: integer("barberId").notNull(),
    clientName: varchar("clientName", { length: 255 }).notNull(),
    clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
    clientPhone: varchar("clientPhone", { length: 20 }).notNull(),
    appointmentDate: varchar("appointmentDate", { length: 10 }).notNull(),
    appointmentTime: varchar("appointmentTime", { length: 5 }).notNull(),
    status: bookingStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    slotUnique: uniqueIndex("bookings_barber_slot_unique").on(
      table.barberId,
      table.appointmentDate,
      table.appointmentTime
    ),
  })
);

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Services table for storing available services
 */
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer("durationMinutes").default(30).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Barbers table for storing barber information
 */
export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 255 }),
  experience: varchar("experience", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = typeof barbers.$inferInsert;
