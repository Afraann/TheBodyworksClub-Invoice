// lib/auth.ts
import { prisma } from './db';

const SESSION_DAYS = 7;

// Helper to add days to a Date
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Create a session record in DB (no cookies here)
export async function createSession(
  branchId: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = addDays(now, SESSION_DAYS);

  await prisma.session.create({
    data: {
      id: sessionId,
      branchId,
      createdAt: now,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { sessionId, expiresAt };
}

// Delete session record by ID (no cookies here)
export async function deleteSession(sessionId: string) {
  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  } catch {
    // ignore if already deleted / not found
  }
}
