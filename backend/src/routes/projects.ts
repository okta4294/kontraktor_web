import { Elysia, t } from "elysia";
import { db } from "../db";
import { projects, userProjects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const projectsRoutes = new Elysia({ prefix: "/projects" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async ({ user }) => {
    const u = user as any;
    if (u.role === "administrator") {
      const data = await db.select().from(projects).orderBy(projects.nama);
      return { success: true, data };
    }
    const rows = await db
      .select()
      .from(projects)
      .innerJoin(userProjects, eq(projects.id, userProjects.projectId))
      .where(eq(userProjects.userId, u.id))
      .orderBy(projects.nama);
    return { success: true, data: rows.map((r) => r.projects) };
  })
  .get("/:id", async ({ params, set, user }) => {
    const u = user as any;
    const pid = Number(params.id);
    let data;
    
    if (u.role === "administrator") {
      [data] = await db.select().from(projects).where(eq(projects.id, pid)).limit(1);
    } else {
      const rows = await db
        .select()
        .from(projects)
        .innerJoin(userProjects, eq(projects.id, userProjects.projectId))
        .where(and(eq(projects.id, pid), eq(userProjects.userId, u.id)))
        .limit(1);
      if (rows.length > 0) data = rows[0].projects;
    }

    if (!data) {
      set.status = 404;
      return { success: false, message: "Proyek tidak ditemukan" };
    }
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body, user }) => {
      const u = user as any;
      const [created] = await db.insert(projects).values(body as any).returning();
      
      // Assign creator to the project
      await db.insert(userProjects).values({
        userId: u.id,
        projectId: created.id,
      });

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
    async ({ params, body, set, user }) => {
      const u = user as any;
      const pid = Number(params.id);
      
      if (u.role !== "administrator") {
        const [mapping] = await db
          .select()
          .from(userProjects)
          .where(and(eq(userProjects.projectId, pid), eq(userProjects.userId, u.id)))
          .limit(1);
        if (!mapping) {
          set.status = 403;
          return { success: false, message: "Akses ditolak" };
        }
      }

      const [updated] = await db
        .update(projects)
        .set({ ...body, updatedAt: new Date() } as any)
        .where(eq(projects.id, pid))
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
    async ({ params, set, user }) => {
      const u = user as any;
      const pid = Number(params.id);
      
      if (u.role !== "administrator") {
        const [mapping] = await db
          .select()
          .from(userProjects)
          .where(and(eq(userProjects.projectId, pid), eq(userProjects.userId, u.id)))
          .limit(1);
        if (!mapping) {
          set.status = 403;
          return { success: false, message: "Akses ditolak" };
        }
      }

      const [deleted] = await db.delete(projects).where(eq(projects.id, pid)).returning({ id: projects.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Proyek tidak ditemukan" };
      }
      return { success: true, message: "Proyek berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
