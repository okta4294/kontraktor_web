import { Elysia, t } from "elysia";
import { db } from "../db";
import { barang } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const barangRoutes = new Elysia({ prefix: "/barang" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async ({ query }) => {
    const { projectId, kategori } = query;
    const conditions = [];
    if (projectId) conditions.push(eq(barang.projectId, Number(projectId)));
    if (kategori) conditions.push(eq(barang.kategori, kategori as any));
    const data = await db
      .select()
      .from(barang)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(barang.nama);
    return { success: true, data };
  })
  .get("/:id", async ({ params, set }) => {
    const [data] = await db.select().from(barang).where(eq(barang.id, Number(params.id))).limit(1);
    if (!data) {
      set.status = 404;
      return { success: false, message: "Barang tidak ditemukan" };
    }
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body }) => {
      const [created] = await db.insert(barang).values(body as any).returning();
      return { success: true, data: created };
    },
    {
      body: t.Object({
        projectId: t.Number(),
        nama: t.String(),
        kategori: t.String(),
        satuan: t.String(),
        minStok: t.Optional(t.String()),
        lokasiGudang: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updated] = await db
        .update(barang)
        .set({ ...body, updatedAt: new Date() } as any)
        .where(eq(barang.id, Number(params.id)))
        .returning();
      if (!updated) {
        set.status = 404;
        return { success: false, message: "Barang tidak ditemukan" };
      }
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        projectId: t.Number(),
        nama: t.String(),
        kategori: t.String(),
        satuan: t.String(),
        minStok: t.Optional(t.String()),
        lokasiGudang: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const [deleted] = await db.delete(barang).where(eq(barang.id, Number(params.id))).returning({ id: barang.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Barang tidak ditemukan" };
      }
      return { success: true, message: "Barang berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
