import { Elysia, t } from "elysia";
import { db } from "../db";
import { barang, pembelianItem, pembelian, pemakaianBarang } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const stokRoutes = new Elysia({ prefix: "/stok" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async ({ query }) => {
    const { projectId, kategori } = query;
    const pid = Number(projectId);

    // Get all barang
    const allBarang = await db
      .select()
      .from(barang)
      .where(
        kategori
          ? and(eq(barang.projectId, pid), eq(barang.kategori, kategori as any))
          : eq(barang.projectId, pid)
      );

    // For each barang, calculate stok
    const stokData = await Promise.all(
      allBarang.map(async (b) => {
        // Total dibeli (dari pembelian_item join pembelian)
        const [beli] = await db
          .select({ total: sql<string>`COALESCE(SUM(pi.jumlah), 0)` })
          .from(pembelianItem)
          .innerJoin(pembelian, eq(pembelianItem.pembelianId, pembelian.id))
          .where(and(eq(pembelianItem.barangId, b.id), eq(pembelian.projectId, pid)));

        // Total dipakai
        const [pakai] = await db
          .select({ total: sql<string>`COALESCE(SUM(jumlah), 0)` })
          .from(pemakaianBarang)
          .where(and(eq(pemakaianBarang.barangId, b.id), eq(pemakaianBarang.projectId, pid)));

        // Untuk peralatan: hitung berdasarkan kondisi
        const kondisiData =
          b.kategori === "peralatan"
            ? await db
                .select({
                  kondisi: pemakaianBarang.kondisi,
                  total: sql<string>`COALESCE(SUM(jumlah), 0)`,
                })
                .from(pemakaianBarang)
                .where(and(eq(pemakaianBarang.barangId, b.id), eq(pemakaianBarang.projectId, pid)))
                .groupBy(pemakaianBarang.kondisi)
            : [];

        const totalDibeli = Number(beli?.total || 0);
        const totalDipakai = Number(pakai?.total || 0);

        const kondisiMap: Record<string, number> = {};
        for (const k of kondisiData) {
          if (k.kondisi) kondisiMap[k.kondisi] = Number(k.total);
        }

        return {
          ...b,
          totalDibeli,
          totalDipakai,
          sisa: totalDibeli - totalDipakai,
          rusak: kondisiMap["rusak"] || 0,
          hilang: kondisiMap["hilang"] || 0,
          dipinjam: kondisiMap["dipinjam"] || 0,
          tersedia:
            b.kategori === "peralatan"
              ? totalDibeli - (kondisiMap["rusak"] || 0) - (kondisiMap["hilang"] || 0) - (kondisiMap["dipinjam"] || 0)
              : undefined,
          isBelowMin: totalDibeli - totalDipakai < Number(b.minStok || 0),
        };
      })
    );

    return { success: true, data: stokData };
  });
