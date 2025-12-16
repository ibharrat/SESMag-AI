import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.document.create({
    data: {
      filename: 'test.pdf',
      content: 'This is a test PDF',
      type: 'user_submission',
    },
  });
  console.log('Inserted document:', doc);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
