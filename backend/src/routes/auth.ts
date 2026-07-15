import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import jwt from "@elysiajs/jwt";
import bcrypt from "bcryptjs";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "secret",
    })
  )
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { email, password } = body;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || !user.aktif) {
        set.status = 401;
        return { success: false, message: "Email atau password salah" };
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        set.status = 401;
        return { success: false, message: "Email atau password salah" };
      }

      const token = await jwt.sign({
        sub: String(user.id),
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    }
  )
  .get("/me", async ({ headers, jwt, set }) => {
    const authorization = headers.authorization;
    if (!authorization) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }
    const token = authorization.replace("Bearer ", "");
    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      return { success: false, message: "Token tidak valid" };
    }
    const [user] = await db
      .select({
        id: users.id,
        nama: users.nama,
        email: users.email,
        role: users.role,
        aktif: users.aktif,
      })
      .from(users)
      .where(eq(users.id, Number(payload.sub)))
      .limit(1);

    if (!user) {
      set.status = 404;
      return { success: false, message: "User tidak ditemukan" };
    }
    return { success: true, data: user };
  })
  .post(
    "/register",
    async ({ body, set }) => {
      const { email, password, nama } = body;
      
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        set.status = 400;
        return { success: false, message: "Email sudah terdaftar" };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      const [newUser] = await db.insert(users).values({
        nama,
        email,
        passwordHash,
        role: "operator", // Default role for new users
        aktif: true
      }).returning();

      return {
        success: true,
        message: "Registrasi berhasil",
        data: {
          id: newUser.id,
          nama: newUser.nama,
          email: newUser.email,
        }
      };
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 2 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    }
  );
