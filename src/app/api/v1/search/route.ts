import { NextRequest } from "next/server";
import { eq, and, or } from "drizzle-orm";
import { getNetwork, jsonResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const network = getNetwork(req);
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return errorResponse("Search query required", 400);
  }

  if (query.length > 100) {
    return errorResponse("Query too long", 400);
  }

  try {
    const { db } = await import("@/lib/db");
    const schema = await import("@/lib/db/schema");

    const results: {
      type: string;
      data: unknown;
    }[] = [];

    // Check if query looks like a number (could be an offset)
    const asNumber = parseInt(query, 10);
    const isNumber = !isNaN(asNumber) && String(asNumber) === query;

    // Check if query looks like a pubkey (base58, 32-44 chars)
    const isPubkey = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query);

    // Search clusters
    if (isNumber) {
      const clusters = await db
        .select()
        .from(schema.clusters)
        .where(
          and(
            eq(schema.clusters.network, network),
            eq(schema.clusters.offset, asNumber)
          )
        )
        .limit(5);
      results.push(...clusters.map((c) => ({ type: "cluster", data: c })));
    }

    if (isPubkey) {
      // Search by address across all entity types in parallel
      const [clusters, nodes, computations, programs, mxes] = await Promise.all([
        db
          .select()
          .from(schema.clusters)
          .where(
            and(
              eq(schema.clusters.network, network),
              eq(schema.clusters.address, query)
            )
          )
          .limit(1),
        db
          .select()
          .from(schema.arxNodes)
          .where(
            and(
              eq(schema.arxNodes.network, network),
              or(
                eq(schema.arxNodes.address, query),
                eq(schema.arxNodes.authorityKey, query)
              )
            )
          )
          .limit(5),
        db
          .select()
          .from(schema.computations)
          .where(
            and(
              eq(schema.computations.network, network),
              or(
                eq(schema.computations.address, query),
                eq(schema.computations.payer, query),
                eq(schema.computations.queueTxSig, query),
                eq(schema.computations.finalizeTxSig, query)
              )
            )
          )
          .limit(5),
        db
          .select()
          .from(schema.programs)
          .where(
            and(
              eq(schema.programs.network, network),
              eq(schema.programs.programId, query)
            )
          )
          .limit(1),
        db
          .select()
          .from(schema.mxeAccounts)
          .where(
            and(
              eq(schema.mxeAccounts.network, network),
              or(
                eq(schema.mxeAccounts.address, query),
                eq(schema.mxeAccounts.mxeProgramId, query)
              )
            )
          )
          .limit(5),
      ]);

      results.push(...clusters.map((c) => ({ type: "cluster", data: c })));
      results.push(...nodes.map((n) => ({ type: "node", data: n })));
      results.push(...computations.map((c) => ({ type: "computation", data: c })));
      results.push(...programs.map((p) => ({ type: "program", data: p })));
      results.push(...mxes.map((m) => ({ type: "mxe", data: m })));
    }

    // Search nodes by offset
    if (isNumber) {
      const nodes = await db
        .select()
        .from(schema.arxNodes)
        .where(
          and(
            eq(schema.arxNodes.network, network),
            eq(schema.arxNodes.offset, asNumber)
          )
        )
        .limit(5);
      results.push(...nodes.map((n) => ({ type: "node", data: n })));
    }

    return jsonResponse(results, { network, total: results.length });
  } catch (error) {
    console.error("Search error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Search failed"
    );
  }
}
