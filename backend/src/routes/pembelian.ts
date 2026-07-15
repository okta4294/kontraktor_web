import { Elysia, t } from "elysia";
import { db } from "../db";
import { pembelian, pembelianItem, barang, solarMasuk, supplier } from "../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const pembelianRoutes = new Elysia({ prefix: "/pembelian" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async ({ query }) => {
    const { projectId, tanggalFrom, tanggalTo } = query;
    const conditions: any[] = [];
    if (projectId) conditions.push(eq(pembelian.projectId, Number(projectId)));
    if (tanggalFrom) conditions.push(gte(pembelian.tanggal, tanggalFrom));
    if (tanggalTo) conditions.push(lte(pembelian.tanggal, tanggalTo));
    const data = await db.query.pembelian.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        supplier: true,
        items: { with: { barang: true } },
      },
      orderBy: (p, { desc }) => [desc(p.tanggal)],
    });
    return { success: true, data };
  })
  .get("/:id", async ({ params, set }) => {
    const data = await db.query.pembelian.findFirst({
      where: eq(pembelian.id, Number(params.id)),
      with: { supplier: true, items: { with: { barang: true } } },
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
      const { projectId, tanggal, supplierId, noPo, keterangan, items } = body;

      // Calculate total
      let totalHarga = 0;
      const processedItems = items.map((item: any) => {
        const subtotal = Number(item.jumlah) * Number(item.hargaSatuan);
        const ppn = Number(item.ppn || 0);
        const total = subtotal + (subtotal * ppn) / 100;
        totalHarga += total;
        return { ...item, subtotal: subtotal.toFixed(2), total: total.toFixed(2) };
      });

      // Insert pembelian header
      const [created] = await db
        .insert(pembelian)
        .values({
          projectId,
          tanggal,
          supplierId,
          noPo,
          keterangan,
          totalHarga: totalHarga.toFixed(2),
          createdBy: (user as any).id,
        } as any)
        .returning();

      // Insert items
      for (const item of processedItems) {
        await db.insert(pembelianItem).values({
          pembelianId: created.id,
          barangId: item.barangId,
          jumlah: String(item.jumlah),
          hargaSatuan: String(item.hargaSatuan),
          ppn: String(item.ppn || 0),
          subtotal: item.subtotal,
          total: item.total,
        } as any);

        // Auto-update stok: cek apakah barang kategori solar
        const [brg] = await db.select().from(barang).where(eq(barang.id, item.barangId)).limit(1);
        if (brg?.kategori === "bahan_bakar") {
          // tambah ke solar_masuk
          await db.insert(solarMasuk).values({
            projectId,
            tanggal,
            supplierId,
            jumlahLiter: String(item.jumlah),
            harga: String(item.hargaSatuan),
            keterangan: `Pembelian - ${created.id}`,
            createdBy: (user as any).id,
          } as any);
        }
        // Untuk barang lainnya, stok dihitung dari aggregate pembelian - pemakaian (no stok table needed)
      }

      return { success: true, data: created };
    },
    {
      body: t.Object({
        projectId: t.Number(),
        tanggal: t.String(),
        supplierId: t.Optional(t.Number()),
        noPo: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
        items: t.Array(
          t.Object({
            barangId: t.Number(),
            jumlah: t.Number(),
            hargaSatuan: t.Number(),
            ppn: t.Optional(t.Number()),
          })
        ),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      // Delete items first (cascade should handle this but just in case)
      await db.delete(pembelianItem).where(eq(pembelianItem.pembelianId, Number(params.id)));
      const [deleted] = await db
        .delete(pembelian)
        .where(eq(pembelian.id, Number(params.id)))
        .returning({ id: pembelian.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Data tidak ditemukan" };
      }
      return { success: true, message: "Pembelian berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
