const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  const products = await prisma.product.findMany({ take: 5 });
  console.log('Users:', JSON.stringify(users, null, 2));
  console.log('Products:', JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
