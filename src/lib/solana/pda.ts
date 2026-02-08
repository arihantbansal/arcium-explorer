import { PublicKey } from "@solana/web3.js";
import { ARCIUM_PROGRAM_ID } from "@/lib/constants";

const ARCIUM_PROGRAM = new PublicKey(ARCIUM_PROGRAM_ID);

export function getClusterAddress(offset: number): PublicKey {
  const offsetBuffer = Buffer.alloc(4);
  offsetBuffer.writeUInt32LE(offset);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("Cluster"), offsetBuffer],
    ARCIUM_PROGRAM
  );
  return pda;
}

export function getMempoolAddress(clusterOffset: number): PublicKey {
  const offsetBuffer = Buffer.alloc(4);
  offsetBuffer.writeUInt32LE(clusterOffset);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("Mempool"), offsetBuffer],
    ARCIUM_PROGRAM
  );
  return pda;
}

export function getExecutingPoolAddress(clusterOffset: number): PublicKey {
  const offsetBuffer = Buffer.alloc(4);
  offsetBuffer.writeUInt32LE(clusterOffset);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ExecutingPool"), offsetBuffer],
    ARCIUM_PROGRAM
  );
  return pda;
}

export function getMXEAddress(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("MXEAccount"), programId.toBuffer()],
    ARCIUM_PROGRAM
  );
  return pda;
}

export function getCompDefAddress(
  programId: PublicKey,
  defOffset: number
): PublicKey {
  const offsetBuffer = Buffer.alloc(4);
  offsetBuffer.writeUInt32LE(defOffset);
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("ComputationDefinitionAccount"),
      programId.toBuffer(),
      offsetBuffer,
    ],
    ARCIUM_PROGRAM
  );
  return pda;
}

export function getComputationAddress(
  clusterOffset: number,
  computationOffset: bigint | number
): PublicKey {
  const clusterBuffer = Buffer.alloc(4);
  clusterBuffer.writeUInt32LE(clusterOffset);
  const compBuffer = Buffer.alloc(8);
  compBuffer.writeBigUInt64LE(BigInt(computationOffset));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ComputationAccount"), clusterBuffer, compBuffer],
    ARCIUM_PROGRAM
  );
  return pda;
}
