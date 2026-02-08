import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getNetwork, getPagination, jsonResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const network = getNetwork(req);
  const { page, limit, offset } = getPagination(req);

  try {
    const { db } = await import("@/lib/db");
    const { clusters } = await import("@/lib/db/schema");
    const { count } = await import("drizzle-orm");

    const [totalResult] = await db
      .select({ count: count() })
      .from(clusters)
      .where(eq(clusters.network, network));

    const data = await db
      .select()
      .from(clusters)
      .where(eq(clusters.network, network))
      .orderBy(desc(clusters.offset))
      .limit(limit)
      .offset(offset);

    return jsonResponse(data, {
      network,
      page,
      limit,
      total: totalResult.count,
    });
  } catch (error) {
    console.error("Clusters API error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch clusters"
    );
  }
}
