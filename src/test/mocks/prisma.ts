import { vi } from "vitest";

// Shared mock for all Prisma model methods
function createModelMock() {
  return {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
}

export const prismaMock = {
  video: createModelMock(),
  path: createModelMock(),
  pathStep: createModelMock(),
  user: createModelMock(),
  userProgress: createModelMock(),
  feedback: createModelMock(),
  appSetting: createModelMock(),
  account: createModelMock(),
  session: createModelMock(),
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
