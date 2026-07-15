import { Elysia, t } from "elysia";
import { db } from "../db";
import {
  operasionalAlat, alatBerat, solarMasuk, solarKeluar, supplier,
  pembelian, pembelianItem, barang, pemakaianBarang,
} from "../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";
import * as XLSX from "xlsx";

export const laporanRoutes = new Elysia({ prefix: "/laporan" })
  .use(authPlugin)
  .use(requireAuth)
  // ── Laporan Operasional Alat ──────────────────────────────────────────────────
  .get("/operasional", async ({ query }) => {
    const { projectId, tanggalFrom, tanggalTo, alatBeratId, operator, format } = query;
    const conditions: any[] = [];
    if (projectId) conditions.push(eq(operasionalAlat.projectId, Number(projectId)));
    if (alatBeratId) conditions.push(eq(operasionalAlat.alatBeratId, Number(alatBeratId)));
    if (operator) conditions.push(eq(operasionalAlat.operator, operator));
    if (tanggalFrom) conditions.push(gte(operasionalAlat.tanggal, tanggalFrom));
    if (tanggalTo) conditions.push(lte(operasionalAlat.tanggal, tanggalTo));

    const data = await db.query.operasionalAlat.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { alatBerat: true },
      orderBy: (o, { asc }) => [asc(o.tanggal)],
    });

    if (format === "excel") {
      const rows = data.map((d) => ({
        Tanggal: d.tanggal,
        "Alat Berat": d.alatBerat?.nama || "",
        Operator: d.operator,
        "Jam Mulai": d.jamMulaiKerja,
        "Jam Selesai": d.jamSelesaiKerja,
        "Durasi Kerja (jam)": d.durasiKerja,
        "Durasi Istirahat (jam)": d.durasiIstirahat,
        "Durasi Trouble (jam)": d.durasiTrouble,
        "Jam Efektif (jam)": d.jamEfektif,
        "Solar (liter)": d.solarLiter,
        Alasan_Trouble: d.alasanTrouble || "",
        Catatan: d.catatan || "",
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Operasional");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=laporan_operasional.xlsx",
        },
      });
    }
    return { success: true, data };
  })
  // ── Laporan Solar ────────────────────────────────────────────────────────────
  .get("/solar", async ({ query }) => {
    const { projectId, tanggalFrom, tanggalTo, format } = query;
    const pid = Number(projectId);

    const masukCond: any[] = [eq(solarMasuk.projectId, pid)];
    const keluarCond: any[] = [eq(solarKeluar.projectId, pid)];
    if (tanggalFrom) {
      masukCond.push(gte(solarMasuk.tanggal, tanggalFrom));
      keluarCond.push(gte(solarKeluar.tanggal, tanggalFrom));
    }
    if (tanggalTo) {
      masukCond.push(lte(solarMasuk.tanggal, tanggalTo));
      keluarCond.push(lte(solarKeluar.tanggal, tanggalTo));
    }

    const masukData = await db.query.solarMasuk.findMany({ where: and(...masukCond), with: { supplier: true } });
    const keluarData = await db.query.solarKeluar.findMany({ where: and(...keluarCond), with: { alatBerat: true } });

    const totalMasuk = masukData.reduce((a, b) => a + Number(b.jumlahLiter), 0);
    const totalKeluar = keluarData.reduce((a, b) => a + Number(b.jumlahLiter), 0);

    if (format === "excel") {
      const wb = XLSX.utils.book_new();
      const rowsMasuk = masukData.map((d) => ({
        Tanggal: d.tanggal,
        Supplier: d.supplier?.nama || "",
        "Jumlah (Liter)": d.jumlahLiter,
        "Harga/Liter": d.harga,
        "No DO": d.noDo || "",
        Keterangan: d.keterangan || "",
      }));
      const rowsKeluar = keluarData.map((d) => ({
        Tanggal: d.tanggal,
        "Alat Berat": d.alatBerat?.nama || "",
        Operator: d.operator || "",
        "Jumlah (Liter)": d.jumlahLiter,
        Keterangan: d.keterangan || "",
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsMasuk), "Solar Masuk");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsKeluar), "Solar Keluar");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=laporan_solar.xlsx",
        },
      });
    }

    return {
      success: true,
      data: { masuk: masukData, keluar: keluarData, totalMasuk, totalKeluar, stokAkhir: totalMasuk - totalKeluar },
    };
  })
  // ── Laporan Pembelian ────────────────────────────────────────────────────────
  .get("/pembelian", async ({ query }) => {
    const { projectId, tanggalFrom, tanggalTo, format } = query;
    const conditions: any[] = [];
    if (projectId) conditions.push(eq(pembelian.projectId, Number(projectId)));
    if (tanggalFrom) conditions.push(gte(pembelian.tanggal, tanggalFrom));
    if (tanggalTo) conditions.push(lte(pembelian.tanggal, tanggalTo));

    const data = await db.query.pembelian.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { supplier: true, items: { with: { barang: true } } },
      orderBy: (p, { asc }) => [asc(p.tanggal)],
    });

    if (format === "excel") {
      const rows: any[] = [];
      data.forEach((p) => {
        p.items.forEach((item) => {
          rows.push({
            Tanggal: p.tanggal,
            Supplier: p.supplier?.nama || "",
            "No PO": p.noPo || "",
            Barang: item.barang?.nama || "",
            Kategori: item.barang?.kategori || "",
            Satuan: item.barang?.satuan || "",
            Jumlah: item.jumlah,
            "Harga Satuan": item.hargaSatuan,
            "PPN (%)": item.ppn,
            Subtotal: item.subtotal,
            Total: item.total,
          });
        });
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Pembelian");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=laporan_pembelian.xlsx",
        },
      });
    }

    return { success: true, data };
  })
  // ── Laporan Material ─────────────────────────────────────────────────────────
  .get("/material", async ({ query }) => {
    const { projectId, format } = query;
    const pid = Number(projectId);

    const allBarang = await db
      .select()
      .from(barang)
      .where(and(eq(barang.projectId, pid), eq(barang.kategori, "material")));

    const reportData = await Promise.all(
      allBarang.map(async (b) => {
        const [beli] = await db
          .select({ total: sql<string>`COALESCE(SUM(pi.jumlah), 0)` })
          .from(pembelianItem)
          .innerJoin(pembelian, eq(pembelianItem.pembelianId, pembelian.id))
          .where(and(eq(pembelianItem.barangId, b.id), eq(pembelian.projectId, pid)));
        const [pakai] = await db
          .select({ total: sql<string>`COALESCE(SUM(jumlah), 0)` })
          .from(pemakaianBarang)
          .where(and(eq(pemakaianBarang.barangId, b.id), eq(pemakaianBarang.projectId, pid)));

        return {
          nama: b.nama,
          satuan: b.satuan,
          totalDibeli: Number(beli?.total || 0),
          totalDipakai: Number(pakai?.total || 0),
          sisa: Number(beli?.total || 0) - Number(pakai?.total || 0),
        };
      })
    );

    if (format === "excel") {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData), "Material");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=laporan_material.xlsx",
        },
      });
    }
    return { success: true, data: reportData };
  })
  // ── Laporan Peralatan ────────────────────────────────────────────────────────
  .get("/peralatan", async ({ query }) => {
    const { projectId, format } = query;
    const pid = Number(projectId);

    const allBarang = await db
      .select()
      .from(barang)
      .where(and(eq(barang.projectId, pid), eq(barang.kategori, "peralatan")));

    const reportData = await Promise.all(
      allBarang.map(async (b) => {
        const [beli] = await db
          .select({ total: sql<string>`COALESCE(SUM(pi.jumlah), 0)` })
          .from(pembelianItem)
          .innerJoin(pembelian, eq(pembelianItem.pembelianId, pembelian.id))
          .where(and(eq(pembelianItem.barangId, b.id), eq(pembelian.projectId, pid)));

        const kondisiData = await db
          .select({
            kondisi: pemakaianBarang.kondisi,
            total: sql<string>`COALESCE(SUM(jumlah), 0)`,
          })
          .from(pemakaianBarang)
          .where(and(eq(pemakaianBarang.barangId, b.id), eq(pemakaianBarang.projectId, pid)))
          .groupBy(pemakaianBarang.kondisi);

        const kondisiMap: Record<string, number> = {};
        kondisiData.forEach((k) => {
          if (k.kondisi) kondisiMap[k.kondisi] = Number(k.total);
        });

        const totalDibeli = Number(beli?.total || 0);
        return {
          nama: b.nama,
          satuan: b.satuan,
          jumlah: totalDibeli,
          rusak: kondisiMap["rusak"] || 0,
          hilang: kondisiMap["hilang"] || 0,
          dipinjam: kondisiMap["dipinjam"] || 0,
          tersedia: totalDibeli - (kondisiMap["rusak"] || 0) - (kondisiMap["hilang"] || 0) - (kondisiMap["dipinjam"] || 0),
        };
      })
    );

    if (format === "excel") {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData), "Peralatan");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=laporan_peralatan.xlsx",
        },
      });
    }
    return { success: true, data: reportData };
  });
