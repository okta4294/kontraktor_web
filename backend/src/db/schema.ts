import { pgTable, text, integer, decimal, timestamp, boolean, pgEnum, serial, date, time, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["administrator", "project_manager", "admin", "logistik", "operator"]);
export const statusAlatEnum = pgEnum("status_alat", ["aktif", "rusak", "maintenance"]);
export const kategoriBarangEnum = pgEnum("kategori_barang", ["material", "peralatan", "atk", "sparepart", "bahan_bakar"]);

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 255 }).notNull(),
  lokasi: text("lokasi"),
  tanggalMulai: date("tanggal_mulai"),
  tanggalSelesai: date("tanggal_selesai"),
  deskripsi: text("deskripsi"),
  aktif: boolean("aktif").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("operator"),
  aktif: boolean("aktif").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── User Project Assignments ─────────────────────────────────────────────────
export const userProjects = pgTable("user_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
});

// ─── Alat Berat ───────────────────────────────────────────────────────────────
export const alatBerat = pgTable("alat_berat", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  nama: varchar("nama", { length: 255 }).notNull(),
  merk: varchar("merk", { length: 100 }),
  tipe: varchar("tipe", { length: 100 }),
  noPolisi: varchar("no_polisi", { length: 50 }),
  noLambung: varchar("no_lambung", { length: 50 }),
  tahun: integer("tahun"),
  kapasitas: varchar("kapasitas", { length: 100 }),
  status: statusAlatEnum("status").default("aktif"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Supplier ─────────────────────────────────────────────────────────────────
export const supplier = pgTable("supplier", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 255 }).notNull(),
  alamat: text("alamat"),
  noHp: varchar("no_hp", { length: 20 }),
  pic: varchar("pic", { length: 100 }),
  jenisBarang: text("jenis_barang"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Barang ───────────────────────────────────────────────────────────────────
export const barang = pgTable("barang", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  nama: varchar("nama", { length: 255 }).notNull(),
  kategori: kategoriBarangEnum("kategori").notNull(),
  satuan: varchar("satuan", { length: 50 }).notNull(),
  minStok: decimal("min_stok", { precision: 10, scale: 2 }).default("0"),
  lokasiGudang: varchar("lokasi_gudang", { length: 100 }),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Operasional Alat Berat ───────────────────────────────────────────────────
export const operasionalAlat = pgTable("operasional_alat", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tanggal: date("tanggal").notNull(),
  alatBeratId: integer("alat_berat_id").references(() => alatBerat.id).notNull(),
  operator: varchar("operator", { length: 100 }).notNull(),
  jamMulaiKerja: time("jam_mulai_kerja").notNull(),
  jamIstirahatMulai: time("jam_istirahat_mulai"),
  jamIstirahatSelesai: time("jam_istirahat_selesai"),
  jamTroubleMulai: time("jam_trouble_mulai"),
  jamTroubleSelesai: time("jam_trouble_selesai"),
  alasanTrouble: text("alasan_trouble"),
  jamSelesaiKerja: time("jam_selesai_kerja").notNull(),
  solarLiter: decimal("solar_liter", { precision: 10, scale: 2 }).default("0"),
  // Computed & stored
  durasiKerja: decimal("durasi_kerja", { precision: 10, scale: 2 }),
  durasiIstirahat: decimal("durasi_istirahat", { precision: 10, scale: 2 }),
  durasiTrouble: decimal("durasi_trouble", { precision: 10, scale: 2 }),
  jamEfektif: decimal("jam_efektif", { precision: 10, scale: 2 }),
  catatan: text("catatan"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Solar Masuk ─────────────────────────────────────────────────────────────
export const solarMasuk = pgTable("solar_masuk", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tanggal: date("tanggal").notNull(),
  jam: time("jam"),
  supplierId: integer("supplier_id").references(() => supplier.id),
  jumlahLiter: decimal("jumlah_liter", { precision: 10, scale: 2 }).notNull(),
  harga: decimal("harga", { precision: 15, scale: 2 }),
  noDo: varchar("no_do", { length: 100 }),
  keterangan: text("keterangan"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Solar Keluar (dari operasional alat) ─────────────────────────────────────
export const solarKeluar = pgTable("solar_keluar", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tanggal: date("tanggal").notNull(),
  jam: time("jam"),
  alatBeratId: integer("alat_berat_id").references(() => alatBerat.id),
  operator: varchar("operator", { length: 100 }),
  jumlahLiter: decimal("jumlah_liter", { precision: 10, scale: 2 }).notNull(),
  keterangan: text("keterangan"),
  operasionalId: integer("operasional_id").references(() => operasionalAlat.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Pembelian Header ─────────────────────────────────────────────────────────
export const pembelian = pgTable("pembelian", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tanggal: date("tanggal").notNull(),
  supplierId: integer("supplier_id").references(() => supplier.id),
  noPo: varchar("no_po", { length: 100 }),
  totalHarga: decimal("total_harga", { precision: 15, scale: 2 }).default("0"),
  keterangan: text("keterangan"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Pembelian Items ──────────────────────────────────────────────────────────
export const pembelianItem = pgTable("pembelian_item", {
  id: serial("id").primaryKey(),
  pembelianId: integer("pembelian_id").references(() => pembelian.id, { onDelete: "cascade" }).notNull(),
  barangId: integer("barang_id").references(() => barang.id).notNull(),
  jumlah: decimal("jumlah", { precision: 10, scale: 2 }).notNull(),
  hargaSatuan: decimal("harga_satuan", { precision: 15, scale: 2 }).notNull(),
  ppn: decimal("ppn", { precision: 5, scale: 2 }).default("0"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }),
  total: decimal("total", { precision: 15, scale: 2 }),
});

// ─── Pemakaian Barang ─────────────────────────────────────────────────────────
export const pemakaianBarang = pgTable("pemakaian_barang", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  tanggal: date("tanggal").notNull(),
  barangId: integer("barang_id").references(() => barang.id).notNull(),
  jumlah: decimal("jumlah", { precision: 10, scale: 2 }).notNull(),
  kondisi: varchar("kondisi", { length: 50 }), // untuk peralatan: rusak, hilang, dipinjam, tersedia
  lokasi: varchar("lokasi", { length: 255 }),
  keterangan: text("keterangan"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const projectsRelations = relations(projects, ({ many }) => ({
  alatBerat: many(alatBerat),
  barang: many(barang),
  operasionalAlat: many(operasionalAlat),
  solarMasuk: many(solarMasuk),
  solarKeluar: many(solarKeluar),
  pembelian: many(pembelian),
  pemakaianBarang: many(pemakaianBarang),
  userProjects: many(userProjects),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userProjects: many(userProjects),
}));

export const alatBeratRelations = relations(alatBerat, ({ one, many }) => ({
  project: one(projects, { fields: [alatBerat.projectId], references: [projects.id] }),
  operasional: many(operasionalAlat),
  solarKeluar: many(solarKeluar),
}));

export const barangRelations = relations(barang, ({ one, many }) => ({
  project: one(projects, { fields: [barang.projectId], references: [projects.id] }),
  pembelianItems: many(pembelianItem),
  pemakaian: many(pemakaianBarang),
}));

export const pembelianRelations = relations(pembelian, ({ one, many }) => ({
  project: one(projects, { fields: [pembelian.projectId], references: [projects.id] }),
  supplier: one(supplier, { fields: [pembelian.supplierId], references: [supplier.id] }),
  items: many(pembelianItem),
}));

export const pembelianItemRelations = relations(pembelianItem, ({ one }) => ({
  pembelian: one(pembelian, { fields: [pembelianItem.pembelianId], references: [pembelian.id] }),
  barang: one(barang, { fields: [pembelianItem.barangId], references: [barang.id] }),
}));

export const operasionalAlatRelations = relations(operasionalAlat, ({ one }) => ({
  project: one(projects, { fields: [operasionalAlat.projectId], references: [projects.id] }),
  alatBerat: one(alatBerat, { fields: [operasionalAlat.alatBeratId], references: [alatBerat.id] }),
  createdByUser: one(users, { fields: [operasionalAlat.createdBy], references: [users.id] }),
}));

export const solarMasukRelations = relations(solarMasuk, ({ one }) => ({
  project: one(projects, { fields: [solarMasuk.projectId], references: [projects.id] }),
  supplier: one(supplier, { fields: [solarMasuk.supplierId], references: [supplier.id] }),
}));

export const solarKeluarRelations = relations(solarKeluar, ({ one }) => ({
  project: one(projects, { fields: [solarKeluar.projectId], references: [projects.id] }),
  alatBerat: one(alatBerat, { fields: [solarKeluar.alatBeratId], references: [alatBerat.id] }),
}));

export const pemakaianBarangRelations = relations(pemakaianBarang, ({ one }) => ({
  project: one(projects, { fields: [pemakaianBarang.projectId], references: [projects.id] }),
  barang: one(barang, { fields: [pemakaianBarang.barangId], references: [barang.id] }),
}));
