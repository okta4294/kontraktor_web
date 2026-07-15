import "dotenv/config";
import { db } from "./index";
import { users, projects } from "./schema";

import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create default admin
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("admin123", salt);
  const [adminUser] = await db
    .insert(users)
    .values({
      nama: "Administrator",
      email: "admin@kontraktor.com",
      passwordHash,
      role: "administrator",
    })
    .onConflictDoNothing()
    .returning();

  console.log("✅ Admin user created:", adminUser?.email || "already exists");

  // Create sample project
  const [project] = await db
    .insert(projects)
    .values({
      nama: "Proyek Pembangunan Jalan Tol",
      lokasi: "Jawa Timur",
      tanggalMulai: "2025-01-01",
      tanggalSelesai: "2026-12-31",
      deskripsi: "Proyek pembangunan jalan tol sepanjang 50 km",
      aktif: true,
    })
    .returning();

  console.log("✅ Sample project created:", project.nama);
  console.log("\n📋 Login credentials:");
  console.log("   Email: admin@kontraktor.com");
  console.log("   Password: admin123");
  console.log("\n✨ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
