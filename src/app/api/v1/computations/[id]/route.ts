import { NextRequest } from "next/server";
import { eq, and, or } from "drizzle-orm";
import { getNetwork, jsonResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const network = getNetwork(req);

  try {
    const { db } = await import("@/lib/db");
    const schema = await import("@/lib/db/schema");

    // Search by address or comp def offset
    const [computation] = await db
      .select()
      .from(schema.computations)
      .where(
        and(
          eq(schema.computations.network, network),
          or(
            eq(schema.computations.address, id),
            eq(schema.computations.compDefOffset, id)
          )
        )
      )
      .limit(1);

    if (!computation) {
      return errorResponse("Computation not found", 404);
    }

    return jsonResponse(computation, { network });
  } catch (error) {
    return handleApiError(error, "Failed to fetch computation");
  }
}
