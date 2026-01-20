import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });

// Log connection on first use
prisma.$connect().catch((err) => {
  console.error("Failed to connect to database:", err);
  console.error("POSTGRES_URL exists:", !!process.env.POSTGRES_URL);
  console.error("DATABASE_URL exists:", !!process.env.DATABASE_URL);
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
