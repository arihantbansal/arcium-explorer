import { eq, and } from "drizzle-orm";
import { getServerConnection } from "@/lib/solana/connection";
import { fetchProgramAccounts, parseClusterAccount, parseArxNodeAccount } from "./account-reader";
import type { Network } from "@/types";

// Lazy db import to avoid initialization errors when DATABASE_URL is missing
async function getDb() {
  const { db } = await import("@/lib/db");
  const schema = await import("@/lib/db/schema");
  return { db, schema };
}

export async function indexClusters(network: Network): Promise<number> {
  const { db, schema } = await getDb();
  const connection = getServerConnection(network);

  // Fetch all accounts from Arcium program
  const accounts = await fetchProgramAccounts(connection);
  let indexed = 0;

  for (const { pubkey, account } of accounts) {
    const parsed = parseClusterAccount(account.data);
    if (!parsed) continue;

    // Attempt to determine offset from account data or PDA derivation
    // For now, we use a heuristic: skip accounts that don't look like clusters
    if (parsed.clusterSize === 0 && parsed.nodeOffsets.length === 0) continue;

    const address = pubkey.toBase58();

    // Try to find existing by address
    const existing = await db
      .select()
      .from(schema.clusters)
      .where(
        and(
          eq(schema.clusters.address, address),
          eq(schema.clusters.network, network)
        )
      )
      .limit(1);

    const data = {
      address,
      clusterSize: parsed.clusterSize,
      maxCapacity: parsed.maxCapacity,
      cuPrice: parsed.cuPrice,
      nodeOffsets: parsed.nodeOffsets,
      blsPublicKey: parsed.blsPublicKey,
      isActive: parsed.isActive,
      network,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(schema.clusters)
        .set(data)
        .where(eq(schema.clusters.id, existing[0].id));
    } else {
      // For new clusters, we need to derive the offset
      // We'll use a counter or derive from PDA analysis
      await db.insert(schema.clusters).values({
        ...data,
        offset: indexed, // placeholder — will be refined with proper PDA derivation
      });
    }
    indexed++;
  }

  return indexed;
}

export async function indexArxNodes(network: Network): Promise<number> {
  const { db, schema } = await getDb();
  const connection = getServerConnection(network);

  const accounts = await fetchProgramAccounts(connection);
  let indexed = 0;

  for (const { pubkey, account } of accounts) {
    const parsed = parseArxNodeAccount(account.data);
    if (!parsed) continue;

    // Skip if it doesn't look like a valid node (no authority)
    if (!parsed.authorityKey) continue;

    const address = pubkey.toBase58();

    const existing = await db
      .select()
      .from(schema.arxNodes)
      .where(
        and(
          eq(schema.arxNodes.address, address),
          eq(schema.arxNodes.network, network)
        )
      )
      .limit(1);

    const data = {
      address,
      authorityKey: parsed.authorityKey,
      ip: parsed.ip,
      clusterOffset: parsed.clusterOffset,
      cuCapacityClaim: parsed.cuCapacityClaim,
      isActive: parsed.isActive,
      blsPublicKey: parsed.blsPublicKey,
      x25519PublicKey: parsed.x25519PublicKey,
      network,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(schema.arxNodes)
        .set(data)
        .where(eq(schema.arxNodes.id, existing[0].id));
    } else {
      await db.insert(schema.arxNodes).values({
        ...data,
        offset: indexed,
      });
    }
    indexed++;
  }

  return indexed;
}

export async function indexAll(network: Network) {
  const startTime = Date.now();
  const results = {
    clusters: 0,
    nodes: 0,
    duration: 0,
  };

  try {
    results.clusters = await indexClusters(network);
    results.nodes = await indexArxNodes(network);
  } catch (error) {
    console.error(`Indexer error for ${network}:`, error);
    throw error;
  }

  results.duration = Date.now() - startTime;
  return results;
}
