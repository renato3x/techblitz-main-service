import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@common/services/prisma.service';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeAll(async () => {
    const container = await new PostgreSqlContainer().start();
    process.env.DATABASE_URL = container.getConnectionUri();
  }, 30000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
