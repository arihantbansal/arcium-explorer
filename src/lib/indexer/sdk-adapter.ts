/**
 * SDK adapter: bridges @arcium-hq/client IDL-based deserialization
 * to the explorer's Parsed* interfaces used by the DB upsert layer.
 *
 * Uses BorshAccountsCoder from Anchor to decode raw account buffers
 * (from gRPC/WS subscriptions) without additional RPC calls.
 */
import { BorshAccountsCoder } from "@coral-xyz/anchor";
import { ARCIUM_IDL, ARCIUM_ADDR } from "@arcium-hq/client";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { createLogger } from "@/lib/logger";

const log = createLogger("sdk-adapter");

// Single coder instance — constructed from IDL, no provider needed
const coder = new BorshAccountsCoder(ARCIUM_IDL);

// Re-export client-safe constants (no Node.js deps, safe for "use client" components)
export { UNENRICHABLE_SENTINEL, getArciumError } from "@/lib/arcium-errors";

/** Arcium program PublicKey derived from the SDK IDL. Server-only. */
export const ARCIUM_PROGRAM = new PublicKey(ARCIUM_ADDR);

// ─── Discriminator helpers ─────────────────────────────────────

export const ACCOUNT_NAMES = {
  Cluster: "Cluster",
  ArxNode: "ArxNode",
  MXEAccount: "MXEAccount",
  ComputationDefinitionAccount: "ComputationDefinitionAccount",
  ComputationAccount: "ComputationAccount",
} as const;

export type AccountTypeName = keyof typeof ACCOUNT_NAMES;

const DISCRIMINATOR_MAP = new Map<string, AccountTypeName>();

for (const [typeName, idlName] of Object.entries(ACCOUNT_NAMES)) {
  const disc = coder.accountDiscriminator(idlName);
  // Key is first 8 bytes as hex for fast lookup
  DISCRIMINATOR_MAP.set(
    Buffer.from(disc).toString("hex"),
    typeName as AccountTypeName,
  );
}

/**
 * Match first 8 bytes of account data against known discriminators.
 */
export function identifyAccountType(
  data: Buffer | Uint8Array,
): AccountTypeName | null {
  if (data.length < 8) return null;
  const key = Buffer.from(data.subarray(0, 8)).toString("hex");
  return DISCRIMINATOR_MAP.get(key) ?? null;
}

/**
 * Get discriminator bytes for a given account type (for memcmp filters).
 */
export function getDiscriminatorBytes(type: AccountTypeName): Buffer {
  return Buffer.from(coder.accountDiscriminator(ACCOUNT_NAMES[type]));
}

// ─── Shared helpers ────────────────────────────────────────────

function bnToNumber(val: number | bigint | { toNumber(): number }): number {
  if (typeof val === "number") return val;
  if (typeof val === "bigint") return Number(val);
  return val.toNumber();
}

function bytesToHex(bytes: number[] | Uint8Array): string | null {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (arr.every((b) => b === 0)) return null;
  return Buffer.from(arr).toString("hex");
}

function pubkeyToBase58(val: PublicKey | { toBase58(): string }): string {
  return val.toBase58();
}

// ─── ArxNode ───────────────────────────────────────────────────

export interface ParsedArxNode {
  authorityKey: string;
  ip: string | null;
  clusterOffset: number | null;
  cuCapacityClaim: number;
  isActive: boolean;
  blsPublicKey: string | null;
  x25519PublicKey: string | null;
}

export function decodeArxNode(data: Buffer | Uint8Array): ParsedArxNode | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = coder.decode("ArxNode", Buffer.from(data));

    const x25519PublicKey = bytesToHex(decoded.x25519_pubkey);
    const authorityKey = pubkeyToBase58(decoded.config.authority);

    const ipBytes: number[] = decoded.metadata.ip;
    const ipStr = `${ipBytes[0]}.${ipBytes[1]}.${ipBytes[2]}.${ipBytes[3]}`;
    const ip = ipStr === "0.0.0.0" ? null : ipStr;

    // cluster_membership: Anchor enum { Inactive: {}, Active: number, Proposed: number }
    let clusterOffset: number | null = null;
    let isActive = false;
    const membership = decoded.cluster_membership;
    if (membership.Active !== undefined) {
      clusterOffset = membership.Active;
      isActive = true;
    } else if (membership.Proposed !== undefined) {
      clusterOffset = membership.Proposed;
    }

    const cuCapacityClaim = bnToNumber(decoded.cu_capacity_claim);
    const blsPublicKey = bytesToHex(decoded.bls_pubkey[0] ?? decoded.bls_pubkey);

    return {
      authorityKey,
      ip,
      clusterOffset,
      cuCapacityClaim,
      isActive,
      blsPublicKey,
      x25519PublicKey,
    };
  } catch (err) {
    log.warn("Failed to decode ArxNode", { error: err instanceof Error ? err.message : String(err), dataLen: data.length });
    return null;
  }
}

// ─── Cluster ───────────────────────────────────────────────────

export interface ParsedCluster {
  clusterSize: number;
  maxCapacity: number;
  cuPrice: number;
  nodeOffsets: number[];
  isActive: boolean;
  blsPublicKey: string | null;
}

export function decodeCluster(data: Buffer | Uint8Array): ParsedCluster | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = coder.decode("Cluster", Buffer.from(data));

    const clusterSize: number = decoded.cluster_size;
    const maxCapacity = bnToNumber(decoded.max_capacity);
    const cuPrice = bnToNumber(decoded.cu_price);

    // activation: { activation_epoch: BN, deactivation_epoch: BN }
    const U64_MAX_STR = "18446744073709551615";
    const activationEpoch = decoded.activation.activation_epoch.toString();
    const isActive = activationEpoch !== U64_MAX_STR;

    // nodes: Vec<NodeRef { offset: u32, current_total_rewards: BN, vote: u8 }>
    const nodeOffsets: number[] = [];
    if (Array.isArray(decoded.nodes)) {
      for (const node of decoded.nodes) {
        nodeOffsets.push(node.offset);
      }
    }

    // bls_public_key: SetUnset<BN254G2BLSPublicKey>
    // Anchor enum: { Set: value } or { Unset: [value, bool[]] }
    let blsPublicKey: string | null = null;
    if (decoded.bls_public_key.Set) {
      const inner = decoded.bls_public_key.Set;
      const bytes = inner[0] ?? inner;
      blsPublicKey = bytesToHex(bytes);
    }

    return {
      clusterSize,
      maxCapacity,
      cuPrice,
      nodeOffsets,
      isActive,
      blsPublicKey,
    };
  } catch (err) {
    log.warn("Failed to decode Cluster", { error: err instanceof Error ? err.message : String(err), dataLen: data.length });
    return null;
  }
}

// ─── MXE Account ───────────────────────────────────────────────

export interface ParsedMXEAccount {
  mxeProgramId: string;
  clusterOffset: number | null;
  authority: string | null;
  x25519Pubkey: string | null;
  compDefOffsets: number[];
}

export function decodeMXEAccount(
  data: Buffer | Uint8Array,
): ParsedMXEAccount | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = coder.decode("MXEAccount", Buffer.from(data));

    const mxeProgramId = pubkeyToBase58(decoded.mxe_program_id);

    // cluster: Option<u32>
    const clusterOffset: number | null = decoded.cluster ?? null;

    // authority: Option<pubkey>
    const authority = decoded.authority
      ? pubkeyToBase58(decoded.authority)
      : null;

    // utility_pubkeys: SetUnset<UtilityPubkeys>
    let x25519Pubkey: string | null = null;
    const utilPubkeys = decoded.utility_pubkeys;
    if (utilPubkeys.Set) {
      x25519Pubkey = bytesToHex(utilPubkeys.Set.x25519_pubkey);
    }

    // computation_definitions: Vec<u32>
    const compDefOffsets: number[] = decoded.computation_definitions ?? [];

    return {
      mxeProgramId,
      clusterOffset,
      authority,
      x25519Pubkey,
      compDefOffsets,
    };
  } catch (err) {
    log.warn("Failed to decode MXEAccount", { error: err instanceof Error ? err.message : String(err), dataLen: data.length });
    return null;
  }
}

// ─── Computation Definition ────────────────────────────────────

export interface ParsedComputationDefinition {
  cuAmount: number;
  circuitLen: number;
  sourceType: string;
}

export function decodeComputationDefinition(
  data: Buffer | Uint8Array,
): ParsedComputationDefinition | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = coder.decode(
      "ComputationDefinitionAccount",
      Buffer.from(data),
    );

    const cuAmount = bnToNumber(decoded.cu_amount);
    const circuitLen = decoded.definition.circuit_len;

    // circuit_source: Anchor enum { Local: ..., OnChain: ..., OffChain: ... }
    let sourceType = "unknown";
    const src = decoded.circuit_source;
    if (src.Local !== undefined) {
      sourceType = "local";
    } else if (src.OnChain !== undefined) {
      sourceType = "onchain";
    } else if (src.OffChain !== undefined) {
      sourceType = "offchain";
    }

    return { cuAmount, circuitLen, sourceType };
  } catch (err) {
    log.warn("Failed to decode ComputationDefinition", { error: err instanceof Error ? err.message : String(err), dataLen: data.length });
    return null;
  }
}

// ─── Computation ───────────────────────────────────────────────

export interface ParsedComputation {
  compDefOffset: string;
  clusterOffset: number;
  payer: string;
  mxeProgramId: string | null;
  /** On-chain account only stores "queued" or "finalized".
   *  "executing" and "failed" are derived by the tx-enricher from transaction logs. */
  status: "queued" | "executing" | "finalized" | "failed";
  isScaffold: boolean;
  slot: number;
  queuedAt: Date | null;
  executingAt: Date | null;
  finalizedAt: Date | null;
  failedAt: Date | null;
}

export function decodeComputation(
  data: Buffer | Uint8Array,
): ParsedComputation | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = coder.decode("ComputationAccount", Buffer.from(data));

    const payer = pubkeyToBase58(decoded.payer);
    const mxeProgramId = pubkeyToBase58(decoded.mxe_program_id);
    const compDefOffset = decoded.computation_definition_offset.toString();
    const slot = bnToNumber(decoded.slot);

    // status: Anchor enum — only Queued and Finalized exist on-chain
    let status: ParsedComputation["status"] = "queued";
    if (decoded.status.Finalized !== undefined) {
      status = "finalized";
    }

    const isScaffold = payer === SystemProgram.programId.toBase58();

    return {
      compDefOffset,
      clusterOffset: 0, // derived via MXE join, not stored on computation
      payer,
      mxeProgramId,
      status,
      isScaffold,
      slot,
      queuedAt: null,
      executingAt: null,
      finalizedAt: null,
      failedAt: null,
    };
  } catch (err) {
    log.warn("Failed to decode Computation", { error: err instanceof Error ? err.message : String(err), dataLen: data.length });
    return null;
  }
}
