import { Elysia, t } from "elysia";
import { db } from "../db";
import { pemakaianBarang, barang } from "../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const pemakaianRoutes = new Elysia({ prefix: "/pemakaian" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async ({ query }) => {
    const { projectId, tanggalFrom, tanggalTo, barangId } = query;
    const conditions: any[] = [];
    if (projectId) conditions.push(eq(pemakaianBarang.projectId, Number(projectId)));
    if (barangId) conditions.push(eq(pemakaianBarang.barangId, Number(barangId)));
    if (tanggalFrom) conditions.push(gte(pemakaianBarang.tanggal, tanggalFrom));
    if (tanggalTo) conditions.push(lte(pemakaianBarang.tanggal, tanggalTo));
    const data = await db.query.pemakaianBarang.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { barang: true },
      orderBy: (p, { desc }) => [desc(p.tanggal)],
    });
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body, user }) => {
      const [created] = await db
        .insert(pemakaianBarang)
        .values({ ...body, jumlah: String(body.jumlah), createdBy: (user as any).id } as any)
        .returning();
      return { success: true, data: created };
    },
    {
      body: t.Object({
        projectId: t.Number(),
        tanggal: t.String(),
        barangId: t.Number(),
        jumlah: t.Number(),
        kondisi: t.Optional(t.String()),
        lokasi: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updated] = await db
        .update(pemakaianBarang)
        .set({ ...body, jumlah: String(body.jumlah), updatedAt: new Date() } as any)
        .where(eq(pemakaianBarang.id, Number(params.id)))
        .returning();
      if (!updated) {
        set.status = 404;
        return { success: false, message: "Data tidak ditemukan" };
      }
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        projectId: t.Number(),
        tanggal: t.String(),
        barangId: t.Number(),
        jumlah: t.Number(),
        kondisi: t.Optional(t.String()),
        lokasi: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const [deleted] = await db
        .delete(pemakaianBarang)
        .where(eq(pemakaianBarang.id, Number(params.id)))
        .returning({ id: pemakaianBarang.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Data tidak ditemukan" };
      }
      return { success: true, message: "Data berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
