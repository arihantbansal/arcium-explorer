import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getNetwork, jsonResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

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

    const [[cluster], nodes] = await Promise.all([
      db
        .select()
        .from(schema.clusters)
        .where(and(eq(schema.clusters.offset, offset), eq(schema.clusters.network, network)))
        .limit(1),
      db
        .select()
        .from(schema.arxNodes)
        .where(and(eq(schema.arxNodes.clusterOffset, offset), eq(schema.arxNodes.network, network))),
    ]);

    if (!cluster) {
      return errorResponse("Cluster not found", 404);
    }

    return jsonResponse(
      { ...cluster, nodes },
      { network }
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch cluster");
  }
}
