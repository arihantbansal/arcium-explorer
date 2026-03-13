import type { ComputationStatus } from "@/types";

export interface SharedComputation {
  address: string;
  computationOffset: string;
  status: ComputationStatus;
  callbackErrorCode: number | null;
  payer: string;
  mxeProgramId: string | null;
  queueTxSig: string | null;
  finalizeTxSig: string | null;
  queuedAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
}
