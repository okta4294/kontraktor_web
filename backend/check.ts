import { db } from "./src/db";
import { users } from "./src/db/schema";
import bcrypt from "bcryptjs";

async function check() {
  const [user] = await db.select().from(users);
  if (!user) {
    console.log("No users found in database!");
    process.exit(0);
  }
  
  console.log("Found user:", user.email);
  console.log("Hash:", user.passwordHash);
  
  try {
    const isValid = await bcrypt.compare("admin123", user.passwordHash);
    console.log("Is valid bcrypt?", isValid);
  } catch (err) {
    console.log("Bcrypt compare error:", err);
  }
  
  process.exit(0);
}

check();
