import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, type Prisma } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { PoolConfig } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Create a Postgres adapter using the DATABASE_URL and pass it to PrismaClient.
    const dbUrl = process.env.DATABASE_URL || '';
    const poolConfig: PoolConfig = { connectionString: dbUrl };
    const adapter = new PrismaPg(poolConfig);
    // Cast to the generated Prisma client options type so the constructor accepts it.
    super({ adapter, log: [] } as unknown as Prisma.PrismaClientOptions);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
