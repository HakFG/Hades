const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.entry.count();
  console.log(`Número de entries: ${count}`);
  
  const relationsCount = await prisma.relation.count();
  console.log(`Número de relations: ${relationsCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());