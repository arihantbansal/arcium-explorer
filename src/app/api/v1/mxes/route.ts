import { NextRequest } from "next/server";
import { eq, desc, count } from "drizzle-orm";
import { getNetwork, getPagination, jsonResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const network = getNetwork(req);
  const { page, limit, offset } = getPagination(req);

  try {
    const { db } = await import("@/lib/db");
    const { mxeAccounts } = await import("@/lib/db/schema");

    const [totalResult] = await db
      .select({ count: count() })
      .from(mxeAccounts)
      .where(eq(mxeAccounts.network, network));

    const data = await db
      .select()
      .from(mxeAccounts)
      .where(eq(mxeAccounts.network, network))
      .orderBy(desc(mxeAccounts.createdAt))
      .limit(limit)
      .offset(offset);

    return jsonResponse(data, { network, page, limit, total: totalResult.count });
  } catch (error) {
    console.error("MXEs API error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch MXEs"
    );
  }
}
