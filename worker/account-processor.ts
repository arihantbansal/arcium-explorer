import {
  identifyAccountType,
  decodeCluster,
  decodeArxNode,
  decodeMXEAccount,
  decodeComputationDefinition,
  decodeComputation,
} from "@/lib/indexer/sdk-adapter";
import {
  upsertCluster,
  upsertArxNode,
  upsertMXEAccount,
  upsertComputationDefinition,
  upsertComputation,
} from "@/lib/indexer/upsert";
import type { Network } from "@/types";
import { createLogger } from "./logger";

const log = createLogger("processor");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export interface AccountUpdate {
  address: string;
  data: Buffer | Uint8Array;
  network: Network;
  /** Solana slot of this account update — used to prevent older data overwriting newer */
  slot?: number;
}

async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }
  throw new Error("unreachable");
}

/**
 * Process a single account update: identify type, parse, upsert.
 * Returns the account type name if processed, null if skipped.
 */
export async function processAccountUpdate(update: AccountUpdate): Promise<string | null> {
  const { address, data, network, slot } = update;
  const buf = Buffer.from(data);

  const accountType = identifyAccountType(buf);
  if (!accountType) {
    log.debug("Unknown account type, skipping", { address });
    return null;
  }

  try {
    switch (accountType) {
      case "Cluster": {
        const parsed = decodeCluster(buf);
        if (parsed) {
          await retry(() => upsertCluster(address, parsed, network, slot));
          log.debug("Upserted cluster", { address });
        }
        break;
      }
      case "ArxNode": {
        const parsed = decodeArxNode(buf);
        if (parsed) {
          await retry(() => upsertArxNode(address, parsed, network, slot));
          log.debug("Upserted arx node", { address });
        }
        break;
      }
      case "MXEAccount": {
        const parsed = decodeMXEAccount(buf);
        if (parsed) {
          await retry(() => upsertMXEAccount(address, parsed, network, slot));
          log.debug("Upserted MXE account", { address });
        }
        break;
      }
      case "ComputationDefinitionAccount": {
        const parsed = decodeComputationDefinition(buf);
        if (parsed) {
          await retry(() => upsertComputationDefinition(address, parsed, network));
          log.debug("Upserted computation definition", { address });
        }
        break;
      }
      case "ComputationAccount": {
        const parsed = decodeComputation(buf);
        if (parsed) {
          await retry(() => upsertComputation(address, parsed, network));
          log.debug("Upserted computation", { address });
        }
        break;
      }
    }
    return accountType;
  } catch (error) {
    log.error("Failed to process account", {
      address,
      accountType,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
