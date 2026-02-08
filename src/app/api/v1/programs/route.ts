import { NextRequest } from "next/server";
import { eq, desc, count } from "drizzle-orm";
import { getNetwork, getPagination, jsonResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const network = getNetwork(req);
  const { page, limit, offset } = getPagination(req);

  try {
    const { db } = await import("@/lib/db");
    const { programs } = await import("@/lib/db/schema");

    const [totalResult] = await db
      .select({ count: count() })
      .from(programs)
      .where(eq(programs.network, network));

    const data = await db
      .select()
      .from(programs)
      .where(eq(programs.network, network))
      .orderBy(desc(programs.computationCount))
      .limit(limit)
      .offset(offset);

    return jsonResponse(data, { network, page, limit, total: totalResult.count });
  } catch (error) {
    console.error("Programs API error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch programs"
    );
  }
}
