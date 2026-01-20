import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    console.log(`✅ Successfully set ${email} as ADMIN`);
    console.log(`User ID: ${updated.id}`);
    console.log(`Name: ${updated.name}`);
    console.log(`Role: ${updated.role}`);
  } catch (error) {
    console.error("Error setting admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2] || "nick@rux.sh";
setAdmin(email);
