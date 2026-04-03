import { count, eq, and, lt, gte, or, isNull } from "drizzle-orm";
import { createLogger } from "@/lib/logger";
import { upsertProgram } from "@/lib/indexer/upsert";
import type { Network } from "@/types";

const log = createLogger("snapshots");

const RETENTION_DAYS = Number(process.env.SNAPSHOT_RETENTION_DAYS) || 30;

async function getDb() {
  const { db } = await import("@/lib/db");
  const schema = await import("@/lib/db/schema");
  return { db, schema };
}

async function writeSnapshot(network: Network): Promise<void> {
  const { db, schema } = await getDb();

  const [clusterCount] = await db
    .select({ count: count() })
    .from(schema.clusters)
    .where(eq(schema.clusters.network, network));

  const [activeNodeCount] = await db
    .select({ count: count() })
    .from(schema.arxNodes)
    .where(
      and(
        eq(schema.arxNodes.network, network),
        eq(schema.arxNodes.isActive, true)
      )
    );

  const [computationCount] = await db
    .select({ count: count() })
    .from(schema.computations)
    .where(and(eq(schema.computations.network, network), eq(schema.computations.isScaffold, false)));

  // Approximate computations per minute: count computations queued in last 5 min / 5
  // Prefer queuedAt (on-chain); for rows where queuedAt is null, fall back to createdAt
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
  const [recentCount] = await db
    .select({ count: count() })
    .from(schema.computations)
    .where(
      and(
        eq(schema.computations.network, network),
        eq(schema.computations.isScaffold, false),
        or(
          gte(schema.computations.queuedAt, fiveMinAgo),
          and(
            isNull(schema.computations.queuedAt),
            gte(schema.computations.createdAt, fiveMinAgo)
          )
        )
      )
    );

  const computationsPerMin = recentCount.count / 5;

  await db.insert(schema.networkSnapshots).values({
    timestamp: new Date(),
    totalClusters: clusterCount.count,
    activeNodes: activeNodeCount.count,
    totalComputations: computationCount.count,
    computationsPerMin,
    network,
  });

  log.info("Snapshot written", {
    network,
    clusters: clusterCount.count,
    activeNodes: activeNodeCount.count,
    computations: computationCount.count,
    cpm: computationsPerMin,
  });
}

async function aggregatePrograms(network: Network): Promise<void> {
  const { db, schema } = await getDb();

  // Fetch MXE metadata and computation counts in two queries instead of O(N)
  const [mxeRows, compCounts] = await Promise.all([
    db
      .select({
        address: schema.mxeAccounts.address,
        mxeProgramId: schema.mxeAccounts.mxeProgramId,
        compDefOffsets: schema.mxeAccounts.compDefOffsets,
      })
      .from(schema.mxeAccounts)
      .where(eq(schema.mxeAccounts.network, network)),
    db
      .select({
        mxeProgramId: schema.computations.mxeProgramId,
        count: count(),
      })
      .from(schema.computations)
      .where(
        and(
          eq(schema.computations.network, network),
          eq(schema.computations.isScaffold, false)
        )
      )
      .groupBy(schema.computations.mxeProgramId),
  ]);

  const countMap = new Map(
    compCounts
      .filter((r): r is typeof r & { mxeProgramId: string } => r.mxeProgramId !== null)
      .map((r) => [r.mxeProgramId, r.count])
  );

  let upserted = 0;
  for (const mxe of mxeRows) {
    const compDefCount = Array.isArray(mxe.compDefOffsets)
      ? mxe.compDefOffsets.length
      : 0;

    await upsertProgram(
      mxe.mxeProgramId,
      mxe.address,
      network,
      compDefCount,
      countMap.get(mxe.mxeProgramId) ?? 0
    );
    upserted++;
  }

  log.info("Programs aggregated", { network, count: upserted });
}

export class SnapshotWriter {
  private intervalMs: number;
  private networks: Network[];
  private timer: ReturnType<typeof setInterval> | null = null;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(intervalMs: number, networks: Network[]) {
    this.intervalMs = intervalMs;
    this.networks = networks;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    log.info("Snapshot writer started", {
      intervalMs: this.intervalMs,
      networks: this.networks,
    });

    // Initial snapshot after a short delay (let first poll complete)
    this.delayTimer = setTimeout(() => {
      this.delayTimer = null;
      if (!this.running) return;
      this.writeAll().catch((err) =>
        log.error("Initial snapshot failed", { error: String(err) }),
      );
    }, 60_000);

    this.timer = setInterval(() => {
      if (!this.running) return;
      this.writeAll().catch((err) =>
        log.error("Snapshot cycle failed", { error: String(err) }),
      );
    }, this.intervalMs);
  }

  private async writeAll(): Promise<void> {
    // Run snapshot + aggregation in parallel per network
    await Promise.all(
      this.networks.map(async (network) => {
        await Promise.all([
          writeSnapshot(network).catch((error) =>
            log.error("Snapshot write failed", {
              network,
              error: error instanceof Error ? error.message : String(error),
            }),
          ),
          aggregatePrograms(network).catch((error) =>
            log.error("Program aggregation failed", {
              network,
              error: error instanceof Error ? error.message : String(error),
            }),
          ),
        ]);
      }),
    );

    // Trim old snapshots (run once per cycle, covers all networks)
    try {
      const { db, schema } = await getDb();
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
      await db
        .delete(schema.networkSnapshots)
        .where(lt(schema.networkSnapshots.timestamp, cutoff));
    } catch (error) {
      log.error("Snapshot retention cleanup failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  stop(): void {
    this.running = false;
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    log.info("Snapshot writer stopped");
  }
}
