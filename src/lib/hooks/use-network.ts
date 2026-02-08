"use client";

import { useSearchParams } from "next/navigation";
import type { Network } from "@/types";
import { DEFAULT_NETWORK } from "@/lib/constants";

export function useNetwork(): Network {
  const searchParams = useSearchParams();
  const network = searchParams.get("network");
  if (network === "mainnet" || network === "devnet") return network;
  return DEFAULT_NETWORK;
}
