import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { assessments, applications, adminUsers } from "../../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { requireAuthMiddleware } from "../middleware/identity.js";

async function resolveReviewerName(
  reviewerEmail: string,
  providedName: string
): Promise<string> {
  if (providedName && providedName !== reviewerEmail) return providedName;
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, reviewerEmail.toLowerCase()));
  if (admin?.name) return admin.name;
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
    const allAdmins = await db.select().from(adminUsers);
    const adminNameMap = new Map(
      allAdmins
        .filter((a) => a.name)
        .map((a) => [a.email.toLowerCase(), a.name!])
    );
    return rows.map((a) => ({
      ...a,
      reviewerName:
        a.reviewerName && a.reviewerName !== a.reviewerEmail
          ? a.reviewerName
          : adminNameMap.get(a.reviewerEmail.toLowerCase()) ||
            a.reviewerName ||
            a.reviewerEmail,
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
          eq(assessments.reviewerEmail, data.reviewerEmail)
        )
      );
    return row ?? null;
  });

export const upsertAssessment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    (input: {
      applicationId: number;
      reviewerEmail: string;
      reviewerName: string;
      alignmentWithMission?: number | null;
      needAndImpact?: number | null;
      projectDesignAndOrganisation?: number | null;
      engagementWithOrganisation?: number | null;
      promotionOfMembership?: number | null;
      budgetAndUseOfFunds?: number | null;
      fundingLeverageOtherGrants?: number | null;
      sustainabilityAndLegacy?: number | null;
      comments?: string | null;
    }) => input
  )
  .handler(async ({ data }) => {
    const { applicationId, reviewerEmail, reviewerName: providedName, ...scores } = data;
    const reviewerName = await resolveReviewerName(reviewerEmail, providedName);

    const [existing] = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.applicationId, applicationId),
          eq(assessments.reviewerEmail, reviewerEmail)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(assessments)
        .set({ ...scores, reviewerName, updatedAt: new Date() })
        .where(eq(assessments.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(assessments)
      .values({
        applicationId,
        reviewerEmail,
        reviewerName,
        ...scores,
      })
      .returning();
    return created;
  });

export const deleteAssessment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db.delete(assessments).where(eq(assessments.id, data.id));
    return { success: true };
  });

export const getAllAssessments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const rows = await db
      .select()
      .from(assessments)
      .orderBy(assessments.applicationId, assessments.reviewerName);
    const allAdmins = await db.select().from(adminUsers);
    const adminNameMap = new Map(
      allAdmins
        .filter((a) => a.name)
        .map((a) => [a.email.toLowerCase(), a.name!])
    );
    return rows.map((a) => ({
      ...a,
      reviewerName:
        a.reviewerName && a.reviewerName !== a.reviewerEmail
          ? a.reviewerName
          : adminNameMap.get(a.reviewerEmail.toLowerCase()) ||
            a.reviewerName ||
            a.reviewerEmail,
    }));
  });

export const getApplicationsWithAssessments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const allApps = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));
    const allAssessments = await db
      .select()
      .from(assessments)
      .orderBy(assessments.reviewerName);
    const allAdmins = await db.select().from(adminUsers);
    const adminNameMap = new Map(
      allAdmins
        .filter((a) => a.name)
        .map((a) => [a.email.toLowerCase(), a.name!])
    );

    const resolvedAssessments = allAssessments.map((a) => ({
      ...a,
      reviewerName:
        a.reviewerName && a.reviewerName !== a.reviewerEmail
          ? a.reviewerName
          : adminNameMap.get(a.reviewerEmail.toLowerCase()) ||
            a.reviewerName ||
            a.reviewerEmail,
    }));

    return allApps.map((app) => ({
      ...app,
      assessments: resolvedAssessments.filter(
        (a) => a.applicationId === app.id
      ),
    }));
  });
