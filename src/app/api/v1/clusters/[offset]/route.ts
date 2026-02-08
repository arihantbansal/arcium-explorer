import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getNetwork, jsonResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ offset: string }> }
) {
  const { offset: offsetStr } = await params;
  const network = getNetwork(req);
  const offset = parseInt(offsetStr, 10);

  if (isNaN(offset)) {
    return errorResponse("Invalid cluster offset", 400);
  }

  try {
    const { db } = await import("@/lib/db");
    const schema = await import("@/lib/db/schema");

    const [cluster] = await db
      .select()
      .from(schema.clusters)
      .where(
        and(
          eq(schema.clusters.offset, offset),
          eq(schema.clusters.network, network)
        )
      )
      .limit(1);

    if (!cluster) {
      return errorResponse("Cluster not found", 404);
    }

    // Fetch nodes in this cluster
    const nodes = await db
      .select()
      .from(schema.arxNodes)
      .where(
        and(
          eq(schema.arxNodes.clusterOffset, offset),
          eq(schema.arxNodes.network, network)
        )
      );

    return jsonResponse(
      { ...cluster, nodes },
      { network }
    );
  } catch (error) {
    console.error("Cluster detail error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch cluster"
    );
  }
}
