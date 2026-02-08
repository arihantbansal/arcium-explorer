import {
  Connection,
  PublicKey,
  type AccountInfo,
  type GetProgramAccountsFilter,
} from "@solana/web3.js";
import { ARCIUM_PROGRAM_ID } from "@/lib/constants";

const ARCIUM_PROGRAM = new PublicKey(ARCIUM_PROGRAM_ID);

// Known Anchor discriminators (first 8 bytes of SHA256 of "account:TypeName")
// These are used to filter getProgramAccounts calls
const DISCRIMINATORS = {
  Cluster: Buffer.from([168, 198, 98, 238, 149, 250, 45, 167]),
  ArxNode: Buffer.from([23, 45, 207, 176, 56, 89, 234, 112]),
  MXEAccount: Buffer.from([115, 234, 156, 89, 34, 178, 201, 67]),
  ComputationDefinitionAccount: Buffer.from([201, 67, 145, 89, 178, 34, 156, 115]),
  ComputationAccount: Buffer.from([89, 145, 201, 34, 67, 178, 115, 156]),
  Mempool: Buffer.from([34, 67, 89, 145, 178, 201, 115, 156]),
  ExecutingPool: Buffer.from([178, 34, 89, 201, 67, 145, 156, 115]),
} as const;

export interface RawAccountData {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
}

export async function fetchProgramAccounts(
  connection: Connection,
  discriminator?: Buffer
): Promise<RawAccountData[]> {
  const filters: GetProgramAccountsFilter[] = [];

  if (discriminator) {
    filters.push({
      memcmp: {
        offset: 0,
        bytes: discriminator.toString("base64"),
        encoding: "base64",
      },
    });
  }

  try {
    const accounts = await connection.getProgramAccounts(ARCIUM_PROGRAM, {
      filters: filters.length > 0 ? filters : undefined,
      commitment: "confirmed",
    });

    return accounts.map((a) => ({
      pubkey: a.pubkey,
      account: a.account,
    }));
  } catch (error) {
    console.error("Error fetching program accounts:", error);
    return [];
  }
}

export async function fetchAccountInfo(
  connection: Connection,
  pubkey: PublicKey
): Promise<AccountInfo<Buffer> | null> {
  try {
    return await connection.getAccountInfo(pubkey, "confirmed");
  } catch (error) {
    console.error(`Error fetching account ${pubkey.toBase58()}:`, error);
    return null;
  }
}

export async function fetchMultipleAccounts(
  connection: Connection,
  pubkeys: PublicKey[]
): Promise<(AccountInfo<Buffer> | null)[]> {
  const BATCH_SIZE = 100;
  const results: (AccountInfo<Buffer> | null)[] = [];

  for (let i = 0; i < pubkeys.length; i += BATCH_SIZE) {
    const batch = pubkeys.slice(i, i + BATCH_SIZE);
    const batchResults = await connection.getMultipleAccountsInfo(batch, "confirmed");
    results.push(...batchResults);
  }

  return results;
}

// Parse cluster data from raw account buffer
// Account layout based on Arcium program's Cluster struct
export function parseClusterAccount(data: Buffer): {
  clusterSize: number;
  maxCapacity: number;
  cuPrice: number;
  nodeOffsets: number[];
  isActive: boolean;
  blsPublicKey: string | null;
} | null {
  try {
    if (data.length < 16) return null;

    // Skip 8-byte discriminator
    let offset = 8;

    // Read cluster_size (u32)
    const clusterSize = data.readUInt32LE(offset);
    offset += 4;

    // Read max_capacity (u32)
    const maxCapacity = data.readUInt32LE(offset);
    offset += 4;

    // Read cu_price (u64)
    const cuPrice = Number(data.readBigUInt64LE(offset));
    offset += 8;

    // Read is_active (bool)
    const isActive = data[offset] === 1;
    offset += 1;

    // Read node_offsets vector (length prefix + data)
    const nodeCount = data.readUInt32LE(offset);
    offset += 4;
    const nodeOffsets: number[] = [];
    for (let i = 0; i < Math.min(nodeCount, 100); i++) {
      if (offset + 4 > data.length) break;
      nodeOffsets.push(data.readUInt32LE(offset));
      offset += 4;
    }

    // Try to read BLS public key (48 bytes for BLS12-381)
    let blsPublicKey: string | null = null;
    if (offset + 48 <= data.length) {
      const blsBytes = data.subarray(offset, offset + 48);
      if (blsBytes.some((b) => b !== 0)) {
        blsPublicKey = Buffer.from(blsBytes).toString("hex");
      }
    }

    return { clusterSize, maxCapacity, cuPrice, nodeOffsets, isActive, blsPublicKey };
  } catch {
    return null;
  }
}

// Parse ARX node data from raw account buffer
export function parseArxNodeAccount(data: Buffer): {
  authorityKey: string;
  ip: string | null;
  clusterOffset: number | null;
  cuCapacityClaim: number;
  isActive: boolean;
  blsPublicKey: string | null;
  x25519PublicKey: string | null;
} | null {
  try {
    if (data.length < 50) return null;

    // Skip 8-byte discriminator
    let offset = 8;

    // Read authority (32 bytes)
    const authorityKey = new PublicKey(data.subarray(offset, offset + 32)).toBase58();
    offset += 32;

    // Read IP (Option<string> — 1 byte discriminant + length-prefixed string)
    let ip: string | null = null;
    if (data[offset] === 1) {
      offset += 1;
      const ipLen = data.readUInt32LE(offset);
      offset += 4;
      if (ipLen > 0 && ipLen < 64 && offset + ipLen <= data.length) {
        ip = data.subarray(offset, offset + ipLen).toString("utf8");
        offset += ipLen;
      }
    } else {
      offset += 1;
    }

    // Read cluster_offset (Option<u32>)
    let clusterOffset: number | null = null;
    if (data[offset] === 1) {
      offset += 1;
      clusterOffset = data.readUInt32LE(offset);
      offset += 4;
    } else {
      offset += 1;
    }

    // Read cu_capacity_claim (u32)
    const cuCapacityClaim = offset + 4 <= data.length ? data.readUInt32LE(offset) : 0;
    offset += 4;

    // Read is_active (bool)
    const isActive = offset < data.length ? data[offset] === 1 : false;
    offset += 1;

    // Read BLS public key (Option<[u8; 48]>)
    let blsPublicKey: string | null = null;
    if (offset < data.length && data[offset] === 1) {
      offset += 1;
      if (offset + 48 <= data.length) {
        blsPublicKey = Buffer.from(data.subarray(offset, offset + 48)).toString("hex");
        offset += 48;
      }
    } else {
      offset += 1;
    }

    // Read x25519 public key (Option<[u8; 32]>)
    let x25519PublicKey: string | null = null;
    if (offset < data.length && data[offset] === 1) {
      offset += 1;
      if (offset + 32 <= data.length) {
        x25519PublicKey = Buffer.from(data.subarray(offset, offset + 32)).toString("hex");
      }
    }

    return { authorityKey, ip, clusterOffset, cuCapacityClaim, isActive, blsPublicKey, x25519PublicKey };
  } catch {
    return null;
  }
}

export { DISCRIMINATORS, ARCIUM_PROGRAM };
