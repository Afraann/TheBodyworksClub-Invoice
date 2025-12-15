import { prisma } from '@/lib/db';

const SESSION_DAYS = 7;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function createSession(
  branchId: string,
  role: string,
  staffId?: string, // <--- Added staffId
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
      role,
      staffId, // <--- Store it
      createdAt: now,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { sessionId, expiresAt };
}

export async function deleteSession(sessionId: string) {
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch {}
}