import { db } from "./src/db";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fix() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash("admin123", salt);
  
  await db.update(users)
    .set({ passwordHash: hash })
    .where(eq(users.email, "admin@kontraktor.com"));
    
  console.log("Admin password updated to bcrypt hash!");
  process.exit(0);
}

fix();
