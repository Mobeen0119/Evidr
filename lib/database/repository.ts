import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { caseRecords } from "./schema";
import { demoCase } from "@/lib/investigation/demo-data";
import type { TruthCase } from "@/types/investigation";

async function ensureDemoCase(userId: string) {
  const now = new Date();
  await db
    .insert(caseRecords)
    .values({
      id: demoCase.id,
      userId,
      data: JSON.stringify(demoCase),
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoNothing();
}

export async function listCases(userId: string) {
  await ensureDemoCase(userId);
  const rows = await db
    .select()
    .from(caseRecords)
    .where(eq(caseRecords.userId, userId))
    .orderBy(desc(caseRecords.updatedAt));
  return rows.map((r) => JSON.parse(r.data) as TruthCase);
}

export async function getCase(id: string, userId: string) {
  const rows = await db
    .select()
    .from(caseRecords)
    .where(and(eq(caseRecords.id, id), eq(caseRecords.userId, userId)));
  if (rows.length === 0) return null;
  return JSON.parse(rows[0].data) as TruthCase;
}

export async function saveCase(caseRecord: TruthCase, userId: string) {
  const now = new Date();
  await db
    .insert(caseRecords)
    .values({
      id: caseRecord.id,
      userId,
      data: JSON.stringify(caseRecord),
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [caseRecords.userId, caseRecords.id],
      set: { data: JSON.stringify(caseRecord), updatedAt: now }
    });
  return caseRecord;
}

export async function deleteCase(id: string, userId: string) {
  await db.delete(caseRecords).where(and(eq(caseRecords.id, id), eq(caseRecords.userId, userId)));
}

export async function resetLocalData(userId: string) {
  await db.delete(caseRecords).where(eq(caseRecords.userId, userId));
  await ensureDemoCase(userId);
}

export async function listWatches(userId: string) {
  const cases = await listCases(userId);
  return cases.flatMap((c) => c.watches.map((w) => ({ ...w, caseId: c.id, caseTitle: c.title })));
}
