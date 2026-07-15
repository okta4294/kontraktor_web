import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import jwt from "@elysiajs/jwt";

export const authPlugin = new Elysia({ name: "auth-plugin" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "secret",
    })
  )
  .derive({ as: "global" }, async ({ jwt, headers, set }) => {
    const authorization = headers.authorization;
    if (!authorization) {
      return { user: null };
    }
    const token = authorization.replace("Bearer ", "");
    const payload = await jwt.verify(token);
    if (!payload) {
      return { user: null };
    }
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(payload.sub)))
      .limit(1);
    return { user: userRecord || null };
  });

export const requireAuth = (app: Elysia) =>
  app.derive({ as: "local" }, ({ user, set }: any) => {
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    return { user };
  });

export const requireRoles =
  (...roles: string[]) =>
  (app: Elysia) =>
    app.derive({ as: "local" }, ({ user, set }: any) => {
      if (!user) {
        set.status = 401;
        throw new Error("Unauthorized");
      }
      if (!roles.includes(user.role)) {
        set.status = 403;
        throw new Error("Forbidden");
      }
      return { user };
    });
