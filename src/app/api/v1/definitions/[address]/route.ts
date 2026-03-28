import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getNetwork, jsonResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const network = getNetwork(req);

  try {
    const { db } = await import("@/lib/db");
    const schema = await import("@/lib/db/schema");

    const [def] = await db
      .select()
      .from(schema.computationDefinitions)
      .where(
        and(
          eq(schema.computationDefinitions.address, address),
          eq(schema.computationDefinitions.network, network)
        )
      )
      .limit(1);

    if (!def) {
      return errorResponse("Definition not found", 404);
    }

    return jsonResponse(def, { network });
  } catch (error) {
    return handleApiError(error, "Failed to fetch definition");
  }
}
