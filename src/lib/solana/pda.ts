/**
 * PDA reverse-derivation: brute-force address → offset lookup.
 * Explorer-specific — the SDK only provides forward derivation (offset → address).
 */
import { getClusterAccAddress, getArxNodeAccAddress } from "@arcium-hq/reader";

// Max offset to try when reverse-deriving PDA seeds.
// Arcium offsets are sequential u32s; 100k covers all known clusters/nodes.
const MAX_OFFSET_SEARCH = 100_000;

// PDA derivations are deterministic — cache permanently.
const clusterCache = new Map<string, number>();
const nodeCache = new Map<string, number>();

/**
 * Reverse-derive the cluster offset from a PDA address by brute-forcing
 * the u32 seed space. Results are cached for O(1) subsequent lookups.
 */
export function deriveClusterOffset(address: string): number | null {
  const cached = clusterCache.get(address);
  if (cached !== undefined) return cached;

  for (let i = 0; i <= MAX_OFFSET_SEARCH; i++) {
    if (getClusterAccAddress(i).toBase58() === address) {
      clusterCache.set(address, i);
      return i;
    }
  }
  return null;
}

/**
 * Reverse-derive the ARX node offset from a PDA address.
 * Results are cached for O(1) subsequent lookups.
 */
export function deriveArxNodeOffset(address: string): number | null {
  const cached = nodeCache.get(address);
  if (cached !== undefined) return cached;

  for (let i = 0; i <= MAX_OFFSET_SEARCH; i++) {
    if (getArxNodeAccAddress(i).toBase58() === address) {
      nodeCache.set(address, i);
      return i;
    }
  }
  return null;
}
