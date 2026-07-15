import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { bearer } from "@elysiajs/bearer";
import "dotenv/config";

import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { projectsRoutes } from "./routes/projects";
import { alatBeratRoutes } from "./routes/alat-berat";
import { barangRoutes } from "./routes/barang";
import { supplierRoutes } from "./routes/supplier";
import { operasionalRoutes } from "./routes/operasional";
import { solarRoutes } from "./routes/solar";
import { pembelianRoutes } from "./routes/pembelian";
import { pemakaianRoutes } from "./routes/pemakaian";
import { stokRoutes } from "./routes/stok";
import { laporanRoutes } from "./routes/laporan";
import { dashboardRoutes } from "./routes/dashboard";

const PORT = Number(process.env.PORT) || 3000;

const apiPrefix = "/api";

export const app = new Elysia()
  .use(
    process.env.VERCEL ? (app: any) => app.options("*", () => new Response(null, { status: 200 })) : cors({
      origin: true,
      credentials: true,
    })
  )
  .use(bearer())
  // Health check
  .get("/", () => ({ status: "ok", message: "Kontraktor API v1.0" }))
  // Mount all routes
  .group(apiPrefix, (app) =>
    app
      .use(authRoutes)
      .use(usersRoutes)
      .use(projectsRoutes)
      .use(alatBeratRoutes)
      .use(barangRoutes)
      .use(supplierRoutes)
      .use(operasionalRoutes)
      .use(solarRoutes)
      .use(pembelianRoutes)
      .use(pemakaianRoutes)
      .use(stokRoutes)
      .use(laporanRoutes)
      .use(dashboardRoutes)
  )
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { success: false, message: "Validation error", errors: error.all };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { success: false, message: "Route not found" };
    }
    console.error(error);
    set.status = 500;
    return { success: false, message: "Internal server error" };
  });

// Only listen if not running in Vercel Serverless
if (typeof Bun !== "undefined" && !process.env.VERCEL) {
  app.listen(PORT);
  console.log(`🚀 Server running at http://localhost:${PORT}`);
}

export type App = typeof app;

export default app;
