import { PrismaClient, type Prisma } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import type { PoolConfig } from 'pg';

// Create a Postgres adapter using the DATABASE_URL (similar to PrismaService)
const dbUrl = process.env.DATABASE_URL || '';
const poolConfig: PoolConfig = { connectionString: dbUrl };
const adapter = new PrismaPg(poolConfig);

const prisma = new PrismaClient({ adapter, log: [] } as unknown as Prisma.PrismaClientOptions);

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Starting DB seed...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'apiculteur@example.com' },
    update: {},
    create: {
      email: 'apiculteur@example.com',
      password: passwordHash,
      nom: 'Dupont',
      prenom: 'Jean',
      role: 'APICULTEUR',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: passwordHash,
      nom: 'Admin',
      prenom: 'System',
      role: 'ADMIN',
    },
  });

  let rucher = await prisma.rucher.findFirst({ where: { nom: 'Rucher Test', userId: user.id } });
  if (!rucher) {
    rucher = await prisma.rucher.create({
      data: {
        nom: 'Rucher Test',
        adresse: '10 Rue des Abeilles',
        description: 'Rucher de démonstration',
        userId: user.id,
      },
    });
  }

  let ruche = await prisma.ruche.findFirst({ where: { nom: 'Ruche Test', rucherId: rucher.id } });
  if (!ruche) {
    ruche = await prisma.ruche.create({
      data: {
        nom: 'Ruche Test',
        type: 'DADANT',
        statut: 'ACTIVE',
        rucherId: rucher.id,
        notes: 'Ruche de test',
      },
    });
  }

  const existingInspection = await prisma.inspection.findFirst({ where: { rucheId: ruche.id } });
  if (!existingInspection) {
    await prisma.inspection.create({
      data: {
        date: new Date(),
        etatGeneral: 'BON',
        niveauReserve: 'SUFFISANT',
        comportement: 'NORMAL',
        presenceReine: true,
        nombreCadres: 10,
        presenceMaladie: false,
        recolteKg: 2.5,
        notes: 'Inspection initiale de la ruche de test',
        rucheId: ruche.id,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('DB seed finished.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
