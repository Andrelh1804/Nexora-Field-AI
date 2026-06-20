import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedDefaultAdmin() {
  try {
    const ADMIN_EMAIL = "admin@nexorafield.com.br";
    const ADMIN_PASSWORD = "Admin@123456";

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL))
      .limit(1);

    if (!existing) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await db.insert(usersTable).values({
        name: "Administrador Nexora",
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
        mustChangePassword: true,
      });
      logger.info("Default admin user created: admin@nexorafield.com.br");
    } else {
      logger.info("Default admin user already exists — skipping seed.");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed default admin user");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await seedDefaultAdmin();
});
