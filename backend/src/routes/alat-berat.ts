import { Elysia, t } from "elysia";
import { db } from "../db";
import { alatBerat } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authPlugin, requireAuth } from "../middleware/auth";

export const alatBeratRoutes = new Elysia({ prefix: "/alat-berat" })
  .use(authPlugin)
  .use(requireAuth)
  .get("/", async ({ query }) => {
    const { projectId } = query;
    const conditions = [];
    if (projectId) conditions.push(eq(alatBerat.projectId, Number(projectId)));
    const data = await db
      .select()
      .from(alatBerat)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(alatBerat.nama);
    return { success: true, data };
  })
  .get("/:id", async ({ params, set }) => {
    const [data] = await db.select().from(alatBerat).where(eq(alatBerat.id, Number(params.id))).limit(1);
    if (!data) {
      set.status = 404;
      return { success: false, message: "Alat berat tidak ditemukan" };
    }
    return { success: true, data };
  })
  .post(
    "/",
    async ({ body }) => {
      const [created] = await db.insert(alatBerat).values(body as any).returning();
      return { success: true, data: created };
    },
    {
      body: t.Object({
        projectId: t.Number(),
        nama: t.String(),
        merk: t.Optional(t.String()),
        tipe: t.Optional(t.String()),
        noPolisi: t.Optional(t.String()),
        noLambung: t.Optional(t.String()),
        tahun: t.Optional(t.Number()),
        kapasitas: t.Optional(t.String()),
        status: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updated] = await db
        .update(alatBerat)
        .set({ ...body, updatedAt: new Date() } as any)
        .where(eq(alatBerat.id, Number(params.id)))
        .returning();
      if (!updated) {
        set.status = 404;
        return { success: false, message: "Alat berat tidak ditemukan" };
      }
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        projectId: t.Number(),
        nama: t.String(),
        merk: t.Optional(t.String()),
        tipe: t.Optional(t.String()),
        noPolisi: t.Optional(t.String()),
        noLambung: t.Optional(t.String()),
        tahun: t.Optional(t.Number()),
        kapasitas: t.Optional(t.String()),
        status: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const [deleted] = await db.delete(alatBerat).where(eq(alatBerat.id, Number(params.id))).returning({ id: alatBerat.id });
      if (!deleted) {
        set.status = 404;
        return { success: false, message: "Alat berat tidak ditemukan" };
      }
      return { success: true, message: "Alat berat berhasil dihapus" };
    },
    { params: t.Object({ id: t.String() }) }
  );
