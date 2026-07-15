import { Elysia, t } from "elysia";
import { db } from "../db";
import { projects, userProjects } from "../db/schema";
import { eq } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const projectsRoutes = new Elysia({ prefix: "/projects" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async () => {
    const data = await db.select().from(projects).orderBy(projects.nama);
    return { success: true, data };
  })
  .get("/:id", async ({ params, set }) => {
    const [data] = await db.select().from(projects).where(eq(projects.id, Number(params.id))).limit(1);
    if (!data) {
      set.status = 404;
      return { success: false, message: "Proyek tidak ditemukan" };
    }
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body }) => {
      const [created] = await db.insert(projects).values(body as any).returning();
      return { success: true, data: created };
    },
    {
      body: t.Object({
        nama: t.String(),
        lokasi: t.Optional(t.String()),
        tanggalMulai: t.Optional(t.String()),
        tanggalSelesai: t.Optional(t.String()),
        deskripsi: t.Optional(t.String()),
        aktif: t.Optional(t.Boolean()),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updated] = await db
        .update(projects)
        .set({ ...body, updatedAt: new Date() } as any)
        .where(eq(projects.id, Number(params.id)))
        .returning();
      if (!updated) {
        set.status = 404;
        return { success: false, message: "Proyek tidak ditemukan" };
      }
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        nama: t.String(),
        lokasi: t.Optional(t.String()),
        tanggalMulai: t.Optional(t.String()),
        tanggalSelesai: t.Optional(t.String()),
        deskripsi: t.Optional(t.String()),
        aktif: t.Optional(t.Boolean()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const [deleted] = await db.delete(projects).where(eq(projects.id, Number(params.id))).returning({ id: projects.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Proyek tidak ditemukan" };
      }
      return { success: true, message: "Proyek berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
