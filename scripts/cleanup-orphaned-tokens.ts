import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BATCH_SIZE = 100;

async function main() {
  console.log("🔍 Cleaning orphaned refresh tokens...");

  let skip = 0;
  let totalDeleted = 0;

  while (true) {
    const tokens = await prisma.refreshToken.findMany({
      skip,
      take: BATCH_SIZE,
      select: {
        id: true,
        userId: true,
      },
    });

    if (tokens.length === 0) break;

    const orphanIds: string[] = [];

    // 🔍 Check users in parallel (faster)
    const userChecks = await Promise.all(
      tokens.map(async (token) => {
        if (!token.userId) return token.id;

        const user = await prisma.user.findUnique({
          where: { id: token.userId },
          select: { id: true },
        });

        return user ? null : token.id;
      })
    );

    for (const id of userChecks) {
      if (id) orphanIds.push(id);
    }

    // 🧹 Delete batch
    if (orphanIds.length > 0) {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          id: { in: orphanIds },
        },
      });

      totalDeleted += result.count;
    }

    skip += BATCH_SIZE;
  }

  console.log(`✅ Cleanup complete. Deleted: ${totalDeleted}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });