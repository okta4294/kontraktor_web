import { Elysia, t } from "elysia";
import { db } from "../db";
import {
  alatBerat, operasionalAlat, solarMasuk, solarKeluar, pembelian, barang,
} from "../db/schema";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async ({ query }) => {
    const { projectId } = query;
    const pid = Number(projectId);
    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = today.slice(0, 8) + "01";

    // Total Alat Berat
    const [totalAlat] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(alatBerat)
      .where(and(eq(alatBerat.projectId, pid)));

    // Alat Bekerja Hari Ini
    const [alatBekerja] = await db
      .select({ count: sql<number>`COUNT(DISTINCT alat_berat_id)` })
      .from(operasionalAlat)
      .where(and(eq(operasionalAlat.projectId, pid), eq(operasionalAlat.tanggal, today)));

    // Solar Stok
    const [solarIn] = await db
      .select({ total: sql<string>`COALESCE(SUM(jumlah_liter), 0)` })
      .from(solarMasuk)
      .where(eq(solarMasuk.projectId, pid));
    const [solarOut] = await db
      .select({ total: sql<string>`COALESCE(SUM(jumlah_liter), 0)` })
      .from(solarKeluar)
      .where(eq(solarKeluar.projectId, pid));
    const [solarInToday] = await db
      .select({ total: sql<string>`COALESCE(SUM(jumlah_liter), 0)` })
      .from(solarMasuk)
      .where(and(eq(solarMasuk.projectId, pid), eq(solarMasuk.tanggal, today)));
    const [solarOutToday] = await db
      .select({ total: sql<string>`COALESCE(SUM(jumlah_liter), 0)` })
      .from(solarKeluar)
      .where(and(eq(solarKeluar.projectId, pid), eq(solarKeluar.tanggal, today)));

    // Total Pembelian Bulan Ini
    const [pembelianBulanIni] = await db
      .select({ total: sql<string>`COALESCE(SUM(total_harga), 0)` })
      .from(pembelian)
      .where(and(eq(pembelian.projectId, pid), gte(pembelian.tanggal, firstOfMonth)));

    // Total Material & Peralatan
    const [totalMaterial] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(barang)
      .where(and(eq(barang.projectId, pid), eq(barang.kategori, "material")));
    const [totalPeralatan] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(barang)
      .where(and(eq(barang.projectId, pid), eq(barang.kategori, "peralatan")));

    // Grafik Pembelian Bulanan (6 bulan terakhir)
    const grafikPembelian = await db
      .select({
        bulan: sql<string>`TO_CHAR(tanggal, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(total_harga), 0)`,
      })
      .from(pembelian)
      .where(and(eq(pembelian.projectId, pid), gte(pembelian.tanggal, sql`NOW() - INTERVAL '6 months'`)))
      .groupBy(sql`TO_CHAR(tanggal, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(tanggal, 'YYYY-MM')`);

    // Grafik Penggunaan Solar (30 hari terakhir)
    const grafikSolar = await db
      .select({
        tanggal: solarKeluar.tanggal,
        total: sql<string>`COALESCE(SUM(jumlah_liter), 0)`,
      })
      .from(solarKeluar)
      .where(and(eq(solarKeluar.projectId, pid), gte(solarKeluar.tanggal, sql`NOW() - INTERVAL '30 days'`)))
      .groupBy(solarKeluar.tanggal)
      .orderBy(solarKeluar.tanggal);

    // Grafik Jam Kerja Alat Berat (7 hari terakhir)
    const grafikJamKerja = await db
      .select({
        tanggal: operasionalAlat.tanggal,
        totalJamEfektif: sql<string>`COALESCE(SUM(jam_efektif), 0)`,
      })
      .from(operasionalAlat)
      .where(and(eq(operasionalAlat.projectId, pid), gte(operasionalAlat.tanggal, sql`NOW() - INTERVAL '7 days'`)))
      .groupBy(operasionalAlat.tanggal)
      .orderBy(operasionalAlat.tanggal);

    return {
      success: true,
      data: {
        widgets: {
          totalAlatBerat: Number(totalAlat[0]?.count || 0),
          alatBekerjaHariIni: Number(alatBekerja[0]?.count || 0),
          stokSolar: Number(solarIn[0]?.total || 0) - Number(solarOut[0]?.total || 0),
          solarMasukHariIni: Number(solarInToday[0]?.total || 0),
          solarKeluarHariIni: Number(solarOutToday[0]?.total || 0),
          totalPembelianBulanIni: Number(pembelianBulanIni[0]?.total || 0),
          totalMaterial: Number(totalMaterial[0]?.count || 0),
          totalPeralatan: Number(totalPeralatan[0]?.count || 0),
        },
        grafik: {
          pembelianBulanan: grafikPembelian,
          penggunaanSolar: grafikSolar,
          jamKerjaAlatBerat: grafikJamKerja,
        },
      },
    };
  });
