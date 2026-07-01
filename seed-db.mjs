// Seed script for Postgres/Supabase. Plain JS on purpose (no TS import),
// so it runs with plain `node`, no ts-node/tsx needed.
//
// Usage: DATABASE_URL="postgresql://...supabase connection string..." node seed-db.mjs
//
// Safe to re-run: it checks each table first and only inserts if it's
// empty, so running this twice won't create duplicate rows.

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required. Example:');
  console.error('  DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" node seed-db.mjs');
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

// Real catalog, taken from servicios.html so both the static site and this
// app quote the same prices. Prices are estimates in COP, same as the "*"
// disclaimer on the website — adjust freely, this is just a starting point.
const SERVICES = [
  ['Corte clásico', 'Corte tradicional con precisión y acabado impecable.', '25000.00', 30],
  ['Fade / Degradado', 'Degradado moderno con líneas definidas.', '30000.00', 40],
  ['Corte niño', 'Corte pensado para los más pequeños.', '20000.00', 25],
  ['Diseño de barba', 'Perfilado y diseño de barba con precisión.', '18000.00', 20],
  ['Afeitado clásico', 'Afeitado con navaja y acabado de lujo.', '22000.00', 25],
  ['Tratamiento de barba', 'Hidratación y cuidado para la barba.', '15000.00', 20],
  ['Combo Esencial', 'Corte + diseño de barba.', '38000.00', 50],
  ['Combo Barba Azul', 'Corte + barba + tratamiento facial.', '48000.00', 65],
  ['Combo VIP', 'Experiencia completa: corte, barba, afeitado y tratamiento.', '60000.00', 75],
  ['Limpieza facial', 'Limpieza facial profunda.', '25000.00', 30],
  ['Cejas (diseño)', 'Diseño y perfilado de cejas.', '8000.00', 10],
  ['Mascarilla capilar', 'Tratamiento capilar nutritivo.', '12000.00', 15],
];

// Equipo real de Barba Azul. Sin especialidad/experiencia individual a
// propósito — todos tienen buen nivel en todo tipo de cortes.
const BARBERS = ['Wilfredo', 'Jairo', 'Jesús', 'Daniel'];

async function seed() {
  try {
    const [{ count: serviceCount }] = await sql`SELECT COUNT(*)::int AS count FROM services`;
    if (serviceCount === 0) {
      for (const [name, description, price, durationMinutes] of SERVICES) {
        await sql`
          INSERT INTO services (name, description, price, "durationMinutes")
          VALUES (${name}, ${description}, ${price}, ${durationMinutes})
        `;
      }
      console.log(`✓ Inserted ${SERVICES.length} services`);
    } else {
      console.log('• Services table already has data — skipped');
    }

    const [{ count: barberCount }] = await sql`SELECT COUNT(*)::int AS count FROM barbers`;
    if (barberCount === 0) {
      for (const name of BARBERS) {
        await sql`
          INSERT INTO barbers (name, "isActive")
          VALUES (${name}, true)
        `;
      }
      console.log(`✓ Inserted ${BARBERS.length} barbers`);
    } else {
      console.log('• Barbers table already has data — skipped');
    }

    console.log('✓ Done.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

seed();
