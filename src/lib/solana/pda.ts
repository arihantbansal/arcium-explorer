/**
 * PDA reverse-derivation: brute-force address → offset lookup.
 * Explorer-specific — the SDK only provides forward derivation (offset → address).
 */
import { getClusterAccAddress, getArxNodeAccAddress } from "@arcium-hq/reader";

// Max offset to try when reverse-deriving PDA seeds.
// Arcium offsets are sequential u32s; 100k covers all known clusters/nodes.
const MAX_OFFSET_SEARCH = 100_000;

/**
 * Reverse-derive the cluster offset from a PDA address by brute-forcing
 * the u32 seed space. Returns the offset or null if not found.
 */
export function deriveClusterOffset(address: string): number | null {
  for (let i = 0; i <= MAX_OFFSET_SEARCH; i++) {
    if (getClusterAccAddress(i).toBase58() === address) return i;
  }
  return null;
}

/**
 * Reverse-derive the ARX node offset from a PDA address.
 */
export function deriveArxNodeOffset(address: string): number | null {
  for (let i = 0; i <= MAX_OFFSET_SEARCH; i++) {
    if (getArxNodeAccAddress(i).toBase58() === address) return i;
  }
  return null;
}
