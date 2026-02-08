import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getNetwork, jsonResponse, errorResponse } from "@/lib/api-helpers";

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

    const [program] = await db
      .select()
      .from(schema.programs)
      .where(
        and(
          eq(schema.programs.programId, address),
          eq(schema.programs.network, network)
        )
      )
      .limit(1);

    if (!program) {
      return errorResponse("Program not found", 404);
    }

    // Fetch MXE
    const [mxe] = await db
      .select()
      .from(schema.mxeAccounts)
      .where(
        and(
          eq(schema.mxeAccounts.address, program.mxeAddress),
          eq(schema.mxeAccounts.network, network)
        )
      )
      .limit(1);

    // Fetch comp defs
    const compDefs = await db
      .select()
      .from(schema.computationDefinitions)
      .where(
        and(
          eq(schema.computationDefinitions.mxeProgramId, address),
          eq(schema.computationDefinitions.network, network)
        )
      );

    return jsonResponse(
      { ...program, mxe: mxe || null, computationDefinitions: compDefs },
      { network }
    );
  } catch (error) {
    console.error("Program detail error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch program"
    );
  }
}
