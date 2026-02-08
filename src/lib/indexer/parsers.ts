import { PublicKey } from "@solana/web3.js";

// ─── Cluster ────────────────────────────────────────────────────
// Real on-chain layout (497 bytes):
//   [0..8]    discriminator
//   [8..40]   pubkey1 (cluster authority / config key)
//   [40..72]  pubkey2 (secondary key)
//   [72..]    mixed fields: node slots, status flags, BLS key near end
// Layout is not fully reverse-engineered — we extract what we can.

export interface ParsedCluster {
  clusterSize: number;
  maxCapacity: number;
  cuPrice: number;
  nodeOffsets: number[];
  isActive: boolean;
  blsPublicKey: string | null;
}

export function parseClusterAccount(data: Buffer | Uint8Array): ParsedCluster | null {
  try {
    const buf = Buffer.from(data);
    if (buf.length < 72) return null;

    // The repeating region [88..] has u64 pairs where value is 0 or 1
    // suggesting a fixed-size array of slot occupancy flags.
    // Count "1" values to estimate active node count.
    let activeSlots = 0;
    let totalSlots = 0;
    const nodeOffsets: number[] = [];
    for (let off = 88; off + 8 <= buf.length - 80; off += 8) {
      const val = Number(buf.readBigUInt64LE(off));
      if (val === 0 || val === 1) {
        totalSlots++;
        if (val === 1) {
          activeSlots++;
          nodeOffsets.push(totalSlots - 1);
        }
      } else {
        break; // End of slot array
      }
    }

    // BLS key is near the end (48 bytes before trailing data)
    let blsPublicKey: string | null = null;
    // Known offset based on 497-byte accounts: BLS at ~425..473
    const blsOffset = buf.length - 72;
    if (blsOffset > 72 && blsOffset + 48 <= buf.length) {
      const blsBytes = buf.subarray(blsOffset, blsOffset + 48);
      if (blsBytes.some((b) => b !== 0)) {
        blsPublicKey = Buffer.from(blsBytes).toString("hex");
      }
    }

    // Use slot data as proxy for cluster sizing
    const clusterSize = activeSlots;
    const maxCapacity = totalSlots > 0 ? totalSlots : activeSlots;
    const isActive = activeSlots > 0;

    return {
      clusterSize,
      maxCapacity,
      cuPrice: 0, // Not yet located in layout
      nodeOffsets,
      isActive,
      blsPublicKey,
    };
  } catch {
    return null;
  }
}

// ─── ArxNode ────────────────────────────────────────────────────
// Real on-chain layout (252 bytes, confirmed across all 9 nodes):
//   [0..8]     discriminator
//   [8..40]    authority pubkey (32)
//   [40..72]   program_id — always Arcium program ID (32)
//   [72..104]  p2p identity pubkey (32)
//   [104..152] BLS public key (48)
//   [152..184] x25519 public key (32)
//   [184..252] remaining fields (68 bytes) — status, offsets, capacity

export interface ParsedArxNode {
  authorityKey: string;
  ip: string | null;
  clusterOffset: number | null;
  cuCapacityClaim: number;
  isActive: boolean;
  blsPublicKey: string | null;
  x25519PublicKey: string | null;
}

export function parseArxNodeAccount(data: Buffer | Uint8Array): ParsedArxNode | null {
  try {
    const buf = Buffer.from(data);
    if (buf.length < 184) return null;

    // [8..40] authority pubkey
    const authorityKey = new PublicKey(buf.subarray(8, 40)).toBase58();

    // [40..72] program_id (skip — always Arcium program)

    // [72..104] p2p identity pubkey (we don't store this separately yet)

    // [104..152] BLS public key (48 bytes)
    let blsPublicKey: string | null = null;
    const blsBytes = buf.subarray(104, 152);
    if (blsBytes.some((b) => b !== 0)) {
      blsPublicKey = Buffer.from(blsBytes).toString("hex");
    }

    // [152..184] x25519 public key (32 bytes)
    let x25519PublicKey: string | null = null;
    const x25519Bytes = buf.subarray(152, 184);
    if (x25519Bytes.some((b) => b !== 0)) {
      x25519PublicKey = Buffer.from(x25519Bytes).toString("hex");
    }

    // [184..252] Trailing fields — attempt to read known small values
    // Based on observed data: byte patterns suggest status/config fields
    // Offset 184: often 0x00 0x00 0x00 then values
    let clusterOffset: number | null = null;
    let cuCapacityClaim = 0;
    let isActive = true; // Default to true since these are registered nodes

    if (buf.length >= 192) {
      // Try to extract numeric fields from trailing section
      // Byte 184-187: could be cluster_offset or status
      const trailing = buf.subarray(184);

      // Search for a small u32 that could be cluster_offset (typically 0-100)
      for (let i = 0; i + 4 <= trailing.length; i += 4) {
        const val = trailing.readUInt32LE(i);
        // cu_capacity_claim is often a recognizable value like 100000 (0xa0860100)
        if (val === 100000 || val === 200000 || val === 50000) {
          cuCapacityClaim = val;
          break;
        }
      }

      // Look for cu_capacity as u64 at various offsets in trailing section
      for (let i = 0; i + 8 <= trailing.length; i += 2) {
        const val = Number(trailing.readBigUInt64LE(i));
        if (val === 100000) {
          cuCapacityClaim = val;
          break;
        }
      }
    }

    return {
      authorityKey,
      ip: null, // IP is not directly in the fixed layout
      clusterOffset,
      cuCapacityClaim,
      isActive,
      blsPublicKey,
      x25519PublicKey,
    };
  } catch {
    return null;
  }
}

// ─── MXE Account ────────────────────────────────────────────────
// Real on-chain layout (284 bytes):
//   [0..8]    discriminator
//   [8..]     Layout starts with small values then pubkey data
// Not fully reverse-engineered — extract what we can reliably read.

export interface ParsedMXEAccount {
  mxeProgramId: string;
  clusterOffset: number | null;
  authority: string | null;
  x25519Pubkey: string | null;
  compDefOffsets: number[];
}

export function parseMXEAccount(data: Buffer | Uint8Array): ParsedMXEAccount | null {
  try {
    const buf = Buffer.from(data);
    if (buf.length < 42) return null;

    // Try to find a valid pubkey in the data after discriminator
    // MXE layout observed: byte 8 is a small value (0x01), then data
    // Try reading pubkey at offset 8 (even if first byte is 0x01, the
    // 32 bytes might still form a valid pubkey)
    let mxeProgramId = "unknown";
    let authority: string | null = null;

    // Try pubkey at byte 8
    try {
      const pk = new PublicKey(buf.subarray(8, 40));
      mxeProgramId = pk.toBase58();
    } catch {
      // Not a valid pubkey at offset 8
    }

    // Try pubkey at byte 40
    try {
      const pk = new PublicKey(buf.subarray(40, 72));
      authority = pk.toBase58();
    } catch {
      // ignore
    }

    // x25519 key: try at various known offsets
    let x25519Pubkey: string | null = null;

    // Last bytes often contain small integers (comp def offsets)
    const compDefOffsets: number[] = [];
    // Check last 28 bytes for small u32 values
    if (buf.length >= 260) {
      const tail = buf.subarray(buf.length - 28);
      for (let i = 0; i + 4 <= tail.length; i += 4) {
        const val = tail.readUInt32LE(i);
        if (val > 0 && val < 10000) {
          compDefOffsets.push(val);
        }
      }
    }

    return {
      mxeProgramId,
      clusterOffset: null,
      authority,
      x25519Pubkey,
      compDefOffsets,
    };
  } catch {
    return null;
  }
}

// ─── Computation Definition ─────────────────────────────────────
// Real on-chain layout (242 bytes):
//   [0..8]    discriminator
//   [8..16]   u64 (could be offset/counter)
//   [16..24]  u64 (could be cu_amount)
//   [24..30]  small values (config bytes)
//   [30..34]  u32 (string length = 139)
//   [34..38]  u16 + padding
//   [38..177] URL string (circuit source URL)
//   [177..]   hash/pubkey data + trailing zeros

export interface ParsedComputationDefinition {
  mxeProgramId: string;
  defOffset: number;
  cuAmount: number;
  circuitLen: number;
  sourceType: string;
}

export function parseComputationDefinitionAccount(data: Buffer | Uint8Array): ParsedComputationDefinition | null {
  try {
    const buf = Buffer.from(data);
    if (buf.length < 38) return null;

    // Extract what we can from observed layout
    const field1 = Number(buf.readBigUInt64LE(8));   // first u64 after disc
    const field2 = Number(buf.readBigUInt64LE(16));   // second u64

    // Look for embedded URL to determine source type
    let sourceType = "unknown";
    let circuitLen = 0;

    // Search for "https://" in the data
    const httpsStr = "https://";
    for (let i = 8; i < buf.length - httpsStr.length; i++) {
      if (buf.subarray(i, i + httpsStr.length).toString("utf8") === httpsStr) {
        sourceType = "offchain";
        // Read URL length from preceding u32
        if (i >= 4) {
          const urlLen = buf.readUInt32LE(i - 4);
          if (urlLen > 0 && urlLen < 1000) {
            circuitLen = urlLen;
          }
        }
        break;
      }
    }

    if (sourceType === "unknown") {
      sourceType = "onchain";
    }

    // Use field1 as a proxy for defOffset (it's the first numeric field)
    const defOffset = field1 < 1_000_000 ? field1 : 0;
    const cuAmount = field2 < 100_000_000 ? field2 : 0;

    return {
      mxeProgramId: "unknown", // Not directly at a known offset
      defOffset,
      cuAmount,
      circuitLen,
      sourceType,
    };
  } catch {
    return null;
  }
}

// ─── Computation ────────────────────────────────────────────────
// Real on-chain layout (535 bytes):
//   [0..8]    discriminator
//   [8..40]   pubkey1 (payer or computation key)
//   [40..72]  pubkey2 (program/MXE key, e.g. UMBRAkr...)
//   [72]      option/flag byte
//   [73..105] pubkey3 (conditional, e.g. if byte 72 != 0)
//   [105..]   status fields, offsets, timestamps

export interface ParsedComputation {
  computationOffset: string;
  clusterOffset: number;
  payer: string;
  mxeProgramId: string | null;
  status: "queued" | "executing" | "finalized" | "failed";
  queuedAt: Date | null;
  executingAt: Date | null;
  finalizedAt: Date | null;
  failedAt: Date | null;
}

export function parseComputationAccount(data: Buffer | Uint8Array): ParsedComputation | null {
  try {
    const buf = Buffer.from(data);
    if (buf.length < 105) return null;

    // [8..40] pubkey1 — payer
    const payer = new PublicKey(buf.subarray(8, 40)).toBase58();

    // [40..72] pubkey2 — MXE program / related program
    let mxeProgramId: string | null = null;
    try {
      mxeProgramId = new PublicKey(buf.subarray(40, 72)).toBase58();
    } catch {
      // ignore
    }

    // [72] option byte, [73..105] conditional pubkey
    // Skip to status fields area

    // Look for status-like bytes in the region after pubkeys
    // From observed data at [105..120]:
    // 00 00 00 6e 00 01 01 00 00 00 06 00 00 00 00 00
    // byte 108: 0x6e = 110 — could be a field
    // byte 110: 0x01 — could be status
    let status: "queued" | "executing" | "finalized" | "failed" = "queued";

    // Search for status byte in the region [105..130]
    // Status values: 0=queued, 1=executing, 2=finalized, 3=failed
    // Heuristic: find a recognizable pattern
    const statusRegion = buf.subarray(105, Math.min(135, buf.length));
    for (let i = 0; i < statusRegion.length; i++) {
      const b = statusRegion[i];
      // A status byte should be 0-3 and surrounded by context
      if (b >= 0 && b <= 3) {
        // Check if this could be a status enum
        const STATUS_MAP: Record<number, "queued" | "executing" | "finalized" | "failed"> = {
          0: "queued", 1: "executing", 2: "finalized", 3: "failed",
        };
        if (STATUS_MAP[b]) {
          status = STATUS_MAP[b];
          break;
        }
      }
    }

    // Extract computation offset from early numeric fields
    // Try reading a u64 near the status area
    let computationOffset = "0";
    if (buf.length >= 113) {
      // Look for what could be an offset/counter in the data
      for (let off = 105; off + 8 <= 130 && off + 8 <= buf.length; off += 4) {
        const val = Number(buf.readBigUInt64LE(off));
        if (val > 0 && val < 1_000_000_000) {
          computationOffset = val.toString();
          break;
        }
      }
    }

    return {
      computationOffset,
      clusterOffset: 0,
      payer,
      mxeProgramId,
      status,
      queuedAt: null,
      executingAt: null,
      finalizedAt: null,
      failedAt: null,
    };
  } catch {
    return null;
  }
}
