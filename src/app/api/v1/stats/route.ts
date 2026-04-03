import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getNetwork, handleApiError } from "@/lib/api-helpers";

interface CompStats { total: number; queued: number; executing: number; finalized: number }
interface MetaStats { clusters: number; nodes: number; active_nodes: number; programs: number; mxes: number }

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const network = getNetwork(req);

  try {
    const { db } = await import("@/lib/db");

    // Single query: all computation counts by status + total (excluding scaffolds)
    const compRows = await db.execute(sql`
      SELECT
        count(*) FILTER (WHERE is_scaffold = false) AS total,
        count(*) FILTER (WHERE is_scaffold = false AND status = 'queued') AS queued,
        count(*) FILTER (WHERE is_scaffold = false AND status = 'executing') AS executing,
        count(*) FILTER (WHERE is_scaffold = false AND status = 'finalized') AS finalized
      FROM computations
      WHERE network = ${network}
    `);

    // Single query: cluster, node, active-node, program, mxe counts
    const metaRows = await db.execute(sql`
      SELECT
        (SELECT count(*) FROM clusters WHERE network = ${network}) AS clusters,
        (SELECT count(*) FROM arx_nodes WHERE network = ${network}) AS nodes,
        (SELECT count(*) FROM arx_nodes WHERE network = ${network} AND is_active = true) AS active_nodes,
        (SELECT count(*) FROM programs WHERE network = ${network}) AS programs,
        (SELECT count(*) FROM mxe_accounts WHERE network = ${network}) AS mxes
    `);

    const comp = compRows[0] as unknown as CompStats;
    const meta = metaRows[0] as unknown as MetaStats;

    return NextResponse.json(
      {
        data: {
          totalClusters: Number(meta.clusters),
          totalNodes: Number(meta.nodes),
          activeNodes: Number(meta.active_nodes),
          totalComputations: Number(comp.total),
          queuedComputations: Number(comp.queued),
          executingComputations: Number(comp.executing),
          finalizedComputations: Number(comp.finalized),
          totalPrograms: Number(meta.programs),
          totalMxes: Number(meta.mxes),
        },
        meta: { network },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch stats");
  }
}
