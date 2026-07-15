import { Elysia, t } from "elysia";
import { db } from "../db";
import { operasionalAlat, solarKeluar, alatBerat } from "../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

// Helper: parse time string "HH:MM" to minutes
function timeToMinutes(time: string | null | undefined): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function calcDurasi(start: string | null | undefined, end: string | null | undefined): number {
  if (!start || !end) return 0;
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return diff > 0 ? diff : 0;
}

export const operasionalRoutes = new Elysia({ prefix: "/operasional" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async ({ query }) => {
    const { projectId, tanggalFrom, tanggalTo, alatBeratId } = query;
    const conditions: any[] = [];
    if (projectId) conditions.push(eq(operasionalAlat.projectId, Number(projectId)));
    if (alatBeratId) conditions.push(eq(operasionalAlat.alatBeratId, Number(alatBeratId)));
    if (tanggalFrom) conditions.push(gte(operasionalAlat.tanggal, tanggalFrom));
    if (tanggalTo) conditions.push(lte(operasionalAlat.tanggal, tanggalTo));

    const data = await db.query.operasionalAlat.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { alatBerat: true },
      orderBy: (o, { desc }) => [desc(o.tanggal)],
    });
    return { success: true, data };
  })
  .get("/:id", async ({ params, set }) => {
    const data = await db.query.operasionalAlat.findFirst({
      where: eq(operasionalAlat.id, Number(params.id)),
      with: { alatBerat: true },
    });
    if (!data) {
      set.status = 404;
      return { success: false, message: "Data tidak ditemukan" };
    }
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body, user }) => {
      const {
        projectId, tanggal, alatBeratId, operator,
        jamMulaiKerja, jamIstirahatMulai, jamIstirahatSelesai,
        jamTroubleMulai, jamTroubleSelesai, alasanTrouble,
        jamSelesaiKerja, solarLiter, catatan,
      } = body;

      // Auto-calculate durations (in hours, decimal)
      const durasiKerjaMin = calcDurasi(jamMulaiKerja, jamSelesaiKerja);
      const durasiIstirahatMin = calcDurasi(jamIstirahatMulai, jamIstirahatSelesai);
      const durasiTroubleMin = calcDurasi(jamTroubleMulai, jamTroubleSelesai);
      const jamEfektifMin = durasiKerjaMin - durasiIstirahatMin - durasiTroubleMin;

      const toHours = (min: number) => (min / 60).toFixed(2);

      const [created] = await db.insert(operasionalAlat).values({
        projectId,
        tanggal,
        alatBeratId,
        operator,
        jamMulaiKerja,
        jamIstirahatMulai,
        jamIstirahatSelesai,
        jamTroubleMulai,
        jamTroubleSelesai,
        alasanTrouble,
        jamSelesaiKerja,
        solarLiter: String(solarLiter || 0),
        durasiKerja: toHours(durasiKerjaMin),
        durasiIstirahat: toHours(durasiIstirahatMin),
        durasiTrouble: toHours(durasiTroubleMin),
        jamEfektif: toHours(jamEfektifMin > 0 ? jamEfektifMin : 0),
        catatan,
        createdBy: (user as any).id,
      } as any).returning();

      // Auto-create solar_keluar entry if solar > 0
      if (solarLiter && Number(solarLiter) > 0) {
        await db.insert(solarKeluar).values({
          projectId,
          tanggal,
          jam: jamMulaiKerja,
          alatBeratId,
          operator,
          jumlahLiter: String(solarLiter),
          keterangan: `Operasional - ${tanggal}`,
          operasionalId: created.id,
          createdBy: (user as any).id,
        } as any);
      }

      return { success: true, data: created };
    },
    {
      body: t.Object({
        projectId: t.Number(),
        tanggal: t.String(),
        alatBeratId: t.Number(),
        operator: t.String(),
        jamMulaiKerja: t.String(),
        jamIstirahatMulai: t.Optional(t.String()),
        jamIstirahatSelesai: t.Optional(t.String()),
        jamTroubleMulai: t.Optional(t.String()),
        jamTroubleSelesai: t.Optional(t.String()),
        alasanTrouble: t.Optional(t.String()),
        jamSelesaiKerja: t.String(),
        solarLiter: t.Optional(t.Number()),
        catatan: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const {
        jamMulaiKerja, jamIstirahatMulai, jamIstirahatSelesai,
        jamTroubleMulai, jamTroubleSelesai, jamSelesaiKerja,
      } = body;

      const durasiKerjaMin = calcDurasi(jamMulaiKerja, jamSelesaiKerja);
      const durasiIstirahatMin = calcDurasi(jamIstirahatMulai, jamIstirahatSelesai);
      const durasiTroubleMin = calcDurasi(jamTroubleMulai, jamTroubleSelesai);
      const jamEfektifMin = durasiKerjaMin - durasiIstirahatMin - durasiTroubleMin;
      const toHours = (min: number) => (min / 60).toFixed(2);

      const [updated] = await db
        .update(operasionalAlat)
        .set({
          ...body,
          solarLiter: String(body.solarLiter || 0),
          durasiKerja: toHours(durasiKerjaMin),
          durasiIstirahat: toHours(durasiIstirahatMin),
          durasiTrouble: toHours(durasiTroubleMin),
          jamEfektif: toHours(jamEfektifMin > 0 ? jamEfektifMin : 0),
          updatedAt: new Date(),
        } as any)
        .where(eq(operasionalAlat.id, Number(params.id)))
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
        alatBeratId: t.Number(),
        operator: t.String(),
        jamMulaiKerja: t.String(),
        jamIstirahatMulai: t.Optional(t.String()),
        jamIstirahatSelesai: t.Optional(t.String()),
        jamTroubleMulai: t.Optional(t.String()),
        jamTroubleSelesai: t.Optional(t.String()),
        alasanTrouble: t.Optional(t.String()),
        jamSelesaiKerja: t.String(),
        solarLiter: t.Optional(t.Number()),
        catatan: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const [deleted] = await db
        .delete(operasionalAlat)
        .where(eq(operasionalAlat.id, Number(params.id)))
        .returning({ id: operasionalAlat.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Data tidak ditemukan" };
      }
      return { success: true, message: "Data berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
