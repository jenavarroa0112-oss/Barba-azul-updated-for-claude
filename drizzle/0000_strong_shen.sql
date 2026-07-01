CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "barbers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"specialty" varchar(255),
	"experience" varchar(50),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"serviceId" integer NOT NULL,
	"barberId" integer NOT NULL,
	"clientName" varchar(255) NOT NULL,
	"clientEmail" varchar(320) NOT NULL,
	"clientPhone" varchar(20) NOT NULL,
	"appointmentDate" varchar(10) NOT NULL,
	"appointmentTime" varchar(5) NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"durationMinutes" integer DEFAULT 30 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_barber_slot_unique" ON "bookings" USING btree ("barberId","appointmentDate","appointmentTime");