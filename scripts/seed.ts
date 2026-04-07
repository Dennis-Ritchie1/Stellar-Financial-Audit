import bcrypt from 'bcryptjs';
import {PrismaClient} from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
  const admin = await prisma.user.upsert({
    where: {email: 'admin@stellar-audit.local'},
    update: {passwordHash},
    create: {
      email: 'admin@stellar-audit.local',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Seeded admin user:', admin.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
