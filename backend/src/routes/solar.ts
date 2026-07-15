import { Elysia, t } from "elysia";
import { db } from "../db";
import { solarMasuk, solarKeluar, alatBerat, supplier } from "../db/schema";
import { eq, and, gte, lte, sql, sum } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const solarRoutes = new Elysia({ prefix: "/solar" })
  .use(authPlugin)
  .use(requireAuth)
  // ── Solar Masuk ──────────────────────────────────────────────────────────────
  .get("/masuk", async ({ query }) => {
    const { projectId, tanggalFrom, tanggalTo } = query;
    const conditions: any[] = [];
    if (projectId) conditions.push(eq(solarMasuk.projectId, Number(projectId)));
    if (tanggalFrom) conditions.push(gte(solarMasuk.tanggal, tanggalFrom));
    if (tanggalTo) conditions.push(lte(solarMasuk.tanggal, tanggalTo));
    const data = await db.query.solarMasuk.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { supplier: true },
      orderBy: (s, { desc }) => [desc(s.tanggal)],
    });
    return { success: true, data };
  })
  .post(
    "/masuk",
    async ({ body, user }) => {
      const [created] = await db
        .insert(solarMasuk)
        .values({ ...body, createdBy: (user as any).id } as any)
        .returning();
      return { success: true, data: created };
    },
    {
      body: t.Object({
        projectId: t.Number(),
        tanggal: t.String(),
        jam: t.Optional(t.String()),
        supplierId: t.Optional(t.Number()),
        jumlahLiter: t.String(),
        harga: t.Optional(t.String()),
        noDo: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/masuk/:id",
    async ({ params, body, set }) => {
      const [updated] = await db
        .update(solarMasuk)
        .set({ ...body, updatedAt: new Date() } as any)
        .where(eq(solarMasuk.id, Number(params.id)))
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
        jam: t.Optional(t.String()),
        supplierId: t.Optional(t.Number()),
        jumlahLiter: t.String(),
        harga: t.Optional(t.String()),
        noDo: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/masuk/:id",
    async ({ params, set }) => {
      const [deleted] = await db.delete(solarMasuk).where(eq(solarMasuk.id, Number(params.id))).returning({ id: solarMasuk.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Data tidak ditemukan" };
      }
      return { success: true, message: "Data berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  )
  // ── Solar Keluar ─────────────────────────────────────────────────────────────
  .get("/keluar", async ({ query }) => {
    const { projectId, tanggalFrom, tanggalTo } = query;
    const conditions: any[] = [];
    if (projectId) conditions.push(eq(solarKeluar.projectId, Number(projectId)));
    if (tanggalFrom) conditions.push(gte(solarKeluar.tanggal, tanggalFrom));
    if (tanggalTo) conditions.push(lte(solarKeluar.tanggal, tanggalTo));
    const data = await db.query.solarKeluar.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { alatBerat: true },
      orderBy: (s, { desc }) => [desc(s.tanggal)],
    });
    return { success: true, data };
  })
  .post(
    "/keluar",
    async ({ body, user }) => {
      const [created] = await db
        .insert(solarKeluar)
        .values({ ...body, createdBy: (user as any).id } as any)
        .returning();
      return { success: true, data: created };
    },
    {
      body: t.Object({
        projectId: t.Number(),
        tanggal: t.String(),
        jam: t.Optional(t.String()),
        alatBeratId: t.Optional(t.Number()),
        operator: t.Optional(t.String()),
        jumlahLiter: t.String(),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/keluar/:id",
    async ({ params, set }) => {
      const [deleted] = await db.delete(solarKeluar).where(eq(solarKeluar.id, Number(params.id))).returning({ id: solarKeluar.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Data tidak ditemukan" };
      }
      return { success: true, message: "Data berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  )
  // ── Stok Solar ───────────────────────────────────────────────────────────────
  .get("/stok", async ({ query }) => {
    const { projectId } = query;
    const pid = Number(projectId);
    const [masukResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(jumlah_liter), 0)` })
      .from(solarMasuk)
      .where(eq(solarMasuk.projectId, pid));
    const [keluarResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(jumlah_liter), 0)` })
      .from(solarKeluar)
      .where(eq(solarKeluar.projectId, pid));
    const totalMasuk = Number(masukResult?.total || 0);
    const totalKeluar = Number(keluarResult?.total || 0);
    return {
      success: true,
      data: {
        totalMasuk,
        totalKeluar,
        stokSaatIni: totalMasuk - totalKeluar,
      },
    };
  });
