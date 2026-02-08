import { Connection } from "@solana/web3.js";
import type { Network } from "@/types";
import { RPC_ENDPOINTS } from "@/lib/constants";

const connectionCache = new Map<Network, Connection>();

export function getConnection(network: Network): Connection {
  const cached = connectionCache.get(network);
  if (cached) return cached;

  const endpoint = RPC_ENDPOINTS[network];
  const conn = new Connection(endpoint, {
    commitment: "confirmed",
  });

  connectionCache.set(network, conn);
  return conn;
}

export function getServerConnection(network: Network): Connection {
  const serverEndpoints = {
    devnet: process.env.DEVNET_RPC_URL || RPC_ENDPOINTS.devnet,
    mainnet: process.env.MAINNET_RPC_URL || RPC_ENDPOINTS.mainnet,
  };

  return new Connection(serverEndpoints[network], {
    commitment: "confirmed",
  });
}
