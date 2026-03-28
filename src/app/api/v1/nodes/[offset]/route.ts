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
    return errorResponse("Invalid node offset", 400);
  }

  try {
    const { db } = await import("@/lib/db");
    const schema = await import("@/lib/db/schema");

    const [node] = await db
      .select()
      .from(schema.arxNodes)
      .where(
        and(
          eq(schema.arxNodes.offset, offset),
          eq(schema.arxNodes.network, network)
        )
      )
      .limit(1);

    if (!node) {
      return errorResponse("Node not found", 404);
    }

    return jsonResponse(node, { network });
  } catch (error) {
    return handleApiError(error, "Failed to fetch node");
  }
}
