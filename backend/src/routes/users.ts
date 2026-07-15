import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, ne } from "drizzle-orm";
import { authPlugin, requireRoles } from "../middleware/auth";

export const usersRoutes = new Elysia({ prefix: "/users" })
  .use(authPlugin)
  .use(requireRoles("administrator"))
  .get("/", async () => {
    const data = await db
      .select({
        id: users.id,
        nama: users.nama,
        email: users.email,
        role: users.role,
        aktif: users.aktif,
        createdAt: users.createdAt,
      })
      .from(users);
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body, set }) => {
      const { nama, email, password, role } = body;
      // Check email unique
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        set.status = 400;
        return { success: false, message: "Email sudah terdaftar" };
      }
      const passwordHash = await Bun.password.hash(password);
      const [created] = await db
        .insert(users)
        .values({ nama, email, passwordHash, role: role as any })
        .returning({ id: users.id, nama: users.nama, email: users.email, role: users.role });
      return { success: true, data: created };
    },
    {
      body: t.Object({
        nama: t.String(),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        role: t.String(),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const { nama, email, role, aktif, password } = body;
      const updateData: any = { nama, email, role, aktif, updatedAt: new Date() };
      if (password) {
        updateData.passwordHash = await Bun.password.hash(password);
      }
      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, Number(params.id)))
        .returning({ id: users.id, nama: users.nama, email: users.email, role: users.role });
      if (!updated) {
        set.status = 404;
        return { success: false, message: "User tidak ditemukan" };
      }
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        nama: t.String(),
        email: t.String({ format: "email" }),
        role: t.String(),
        aktif: t.Boolean(),
        password: t.Optional(t.String({ minLength: 6 })),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const [deleted] = await db
        .delete(users)
        .where(eq(users.id, Number(params.id)))
        .returning({ id: users.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "User tidak ditemukan" };
      }
      return { success: true, message: "User berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
