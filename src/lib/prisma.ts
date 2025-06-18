// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Ensure the prisma instance is re-used during hot-reloading in development
  // @ts-expect-error just to avoid TypeScript errors in development
  if (!global.prisma) {
    // @ts-expect-error just to avoid TypeScript errors in development
    global.prisma = new PrismaClient();
  }
  // @ts-expect-error just to avoid TypeScript errors in development
  prisma = global.prisma;
}

export default prisma;