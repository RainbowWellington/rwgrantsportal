import type { Handler, HandlerEvent } from "@netlify/functions";
import { drizzle } from "drizzle-orm/netlify-db";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const adminUsers = pgTable("admin_users", {
  id: serial().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

const db = drizzle();

const handler: Handler = async (event: HandlerEvent) => {
  const payload = JSON.parse(event.body || "{}");
  const userEmail = payload.user?.email?.toLowerCase();

  let roles = ["user"];

  if (userEmail) {
    try {
      const [adminUser] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, userEmail));
      if (adminUser) {
        roles = [adminUser.role];
      }
    } catch {
      // Fall back to default role if DB lookup fails
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        roles,
      },
      user_metadata: {
        ...payload.user?.user_metadata,
        signed_up_at: new Date().toISOString(),
      },
    }),
  };
};

export { handler };
