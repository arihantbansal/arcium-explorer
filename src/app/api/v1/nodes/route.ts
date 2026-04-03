import { NextRequest } from "next/server";
import { eq, and, desc, count } from "drizzle-orm";
import { getNetwork, getPagination, jsonResponse, handleApiError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const network = getNetwork(req);
  const { page, limit, offset } = getPagination(req);
  const clusterFilter = req.nextUrl.searchParams.get("cluster");
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";

  try {
    const { db } = await import("@/lib/db");
    const { arxNodes } = await import("@/lib/db/schema");

    let whereClause = eq(arxNodes.network, network);

    if (clusterFilter) {
      const clusterOffset = parseInt(clusterFilter, 10);
      if (!isNaN(clusterOffset)) {
        whereClause = and(whereClause, eq(arxNodes.clusterOffset, clusterOffset))!;
      }
    }

    if (activeOnly) {
      whereClause = and(whereClause, eq(arxNodes.isActive, true))!;
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(arxNodes)
      .where(whereClause);

    const data = await db
      .select()
      .from(arxNodes)
      .where(whereClause)
      .orderBy(desc(arxNodes.offset))
      .limit(limit)
      .offset(offset);

    return jsonResponse(data, {
      network,
      page,
      limit,
      total: totalResult.count,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch nodes");
  }
}
