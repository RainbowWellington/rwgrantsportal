import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { assessments, applications, adminUsers } from "../../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { requireAuthMiddleware } from "../middleware/identity.js";

async function buildNameMap(): Promise<Map<string, string>> {
  const allAdmins = await db.select().from(adminUsers);
  const map = new Map<string, string>();
  for (const a of allAdmins) {
    if (a.name) {
      map.set(a.email.toLowerCase(), a.name);
    }
  }
  return map;
}

function resolveNameFromMap(
  reviewerEmail: string,
  reviewerName: string | null,
  nameMap: Map<string, string>
): string {
  if (reviewerName && reviewerName !== reviewerEmail) return reviewerName;
  return nameMap.get(reviewerEmail.toLowerCase()) || reviewerName || reviewerEmail;
}

async function resolveReviewerName(
  reviewerEmail: string,
  providedName: string
): Promise<string> {
  if (providedName && providedName !== reviewerEmail) return providedName;
  const [adminRow] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, reviewerEmail.toLowerCase()));
  if (adminRow?.name) return adminRow.name;
  return providedName || reviewerEmail;
}

export const getAssessmentsForApplication = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { applicationId: number }) => input)
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(assessments)
      .where(eq(assessments.applicationId, data.applicationId))
      .orderBy(assessments.reviewerName);
    const nameMap = await buildNameMap();
    return rows.map((a) => ({
      ...a,
      reviewerName: resolveNameFromMap(a.reviewerEmail, a.reviewerName, nameMap),
    }));
  });

export const getAssessmentByReviewer = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: { applicationId: number; reviewerEmail: string }) => input
  )
  .handler(async ({ data }) => {
    const [row] = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.applicationId, data.applicationId),
          eq(assessments.reviewe
