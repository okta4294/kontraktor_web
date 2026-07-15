import { Elysia, t } from "elysia";
import { db } from "../db";
import { supplier } from "../db/schema";
import { eq } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const supplierRoutes = new Elysia({ prefix: "/supplier" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async () => {
    const data = await db.select().from(supplier).orderBy(supplier.nama);
    return { success: true, data };
  })
  .get("/:id", async ({ params, set }) => {
    const [data] = await db.select().from(supplier).where(eq(supplier.id, Number(params.id))).limit(1);
    if (!data) {
      set.status = 404;
      return { success: false, message: "Supplier tidak ditemukan" };
    }
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body }) => {
      const [created] = await db.insert(supplier).values(body as any).returning();
      return { success: true, data: created };
    },
    {
      body: t.Object({
        nama: t.String(),
        alamat: t.Optional(t.String()),
        noHp: t.Optional(t.String()),
        pic: t.Optional(t.String()),
        jenisBarang: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updated] = await db
        .update(supplier)
        .set({ ...body, updatedAt: new Date() } as any)
        .where(eq(supplier.id, Number(params.id)))
        .returning();
      if (!updated) {
        set.status = 404;
        return { success: false, message: "Supplier tidak ditemukan" };
      }
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        nama: t.String(),
        alamat: t.Optional(t.String()),
        noHp: t.Optional(t.String()),
        pic: t.Optional(t.String()),
        jenisBarang: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const [deleted] = await db.delete(supplier).where(eq(supplier.id, Number(params.id))).returning({ id: supplier.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Supplier tidak ditemukan" };
      }
      return { success: true, message: "Supplier berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
