"use client";

import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "./use-network";
import type {
  ApiResponse,
  Network,
  NetworkStats,
  Cluster,
  ArxNode,
  Computation,
  Program,
  MxeAccount,
  ComputationDefinition,
  NetworkSnapshot,
  SearchResultType,
} from "@/types";

async function fetchApi<T>(path: string, network: Network): Promise<ApiResponse<T>> {
  const separator = path.includes("?") ? "&" : "?";
  const res = await fetch(`${path}${separator}network=${network}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new Error(`Invalid JSON response from ${path}`);
  }
}

export function useStats() {
  const network = useNetwork();
  return useQuery<ApiResponse<NetworkStats>>({
    queryKey: ["stats", network],
    queryFn: () => fetchApi<NetworkStats>("/api/v1/stats", network),
  });
}

export function useClusters(page = 1, limit = 20) {
  const network = useNetwork();
  return useQuery<ApiResponse<Cluster[]>>({
    queryKey: ["clusters", network, page, limit],
    queryFn: () =>
      fetchApi<Cluster[]>(`/api/v1/clusters?page=${page}&limit=${limit}`, network),
  });
}

export function useCluster(offset: number) {
  const network = useNetwork();
  return useQuery<ApiResponse<Cluster>>({
    queryKey: ["cluster", network, offset],
    queryFn: () => fetchApi<Cluster>(`/api/v1/clusters/${offset}`, network),
    enabled: offset >= 0,
  });
}

export function useNodes(page = 1, limit = 20, filters?: { cluster?: number; active?: boolean }) {
  const network = useNetwork();
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.cluster !== undefined) params.set("cluster", String(filters.cluster));
  if (filters?.active) params.set("active", "true");
  return useQuery<ApiResponse<ArxNode[]>>({
    queryKey: ["nodes", network, page, limit, filters],
    queryFn: () => fetchApi<ArxNode[]>(`/api/v1/nodes?${params}`, network),
  });
}

export function useNode(offset: number) {
  const network = useNetwork();
  return useQuery<ApiResponse<ArxNode>>({
    queryKey: ["node", network, offset],
    queryFn: () => fetchApi<ArxNode>(`/api/v1/nodes/${offset}`, network),
    enabled: offset >= 0,
  });
}

export function useComputations(
  page = 1,
  limit = 20,
  filters?: { status?: string; cluster?: number; program?: string; scaffold?: string }
) {
  const network = useNetwork();
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.status) params.set("status", filters.status);
  if (filters?.cluster !== undefined) params.set("cluster", String(filters.cluster));
  if (filters?.program) params.set("program", filters.program);
  if (filters?.scaffold) params.set("scaffold", filters.scaffold);
  return useQuery<ApiResponse<Computation[]>>({
    queryKey: ["computations", network, page, limit, filters],
    queryFn: () => fetchApi<Computation[]>(`/api/v1/computations?${params}`, network),
  });
}

export function useComputation(id: string) {
  const network = useNetwork();
  return useQuery<ApiResponse<Computation>>({
    queryKey: ["computation", network, id],
    queryFn: () => fetchApi<Computation>(`/api/v1/computations/${id}`, network),
    enabled: !!id,
  });
}

export function usePrograms(page = 1, limit = 20) {
  const network = useNetwork();
  return useQuery<ApiResponse<Program[]>>({
    queryKey: ["programs", network, page, limit],
    queryFn: () => fetchApi<Program[]>(`/api/v1/programs?page=${page}&limit=${limit}`, network),
  });
}

export function useProgram(address: string) {
  const network = useNetwork();
  return useQuery<ApiResponse<Program>>({
    queryKey: ["program", network, address],
    queryFn: () => fetchApi<Program>(`/api/v1/programs/${address}`, network),
    enabled: !!address,
  });
}

export function useMxes(page = 1, limit = 20) {
  const network = useNetwork();
  return useQuery<ApiResponse<MxeAccount[]>>({
    queryKey: ["mxes", network, page, limit],
    queryFn: () => fetchApi<MxeAccount[]>(`/api/v1/mxes?page=${page}&limit=${limit}`, network),
  });
}

export function useMxe(address: string) {
  const network = useNetwork();
  return useQuery<ApiResponse<MxeAccount>>({
    queryKey: ["mxe", network, address],
    queryFn: () => fetchApi<MxeAccount>(`/api/v1/mxes/${address}`, network),
    enabled: !!address,
  });
}

export function useDefinitions(page = 1, limit = 20) {
  const network = useNetwork();
  return useQuery<ApiResponse<ComputationDefinition[]>>({
    queryKey: ["definitions", network, page, limit],
    queryFn: () =>
      fetchApi<ComputationDefinition[]>(`/api/v1/definitions?page=${page}&limit=${limit}`, network),
  });
}

export function useDefinition(address: string) {
  const network = useNetwork();
  return useQuery<ApiResponse<ComputationDefinition>>({
    queryKey: ["definition", network, address],
    queryFn: () => fetchApi<ComputationDefinition>(`/api/v1/definitions/${address}`, network),
    enabled: !!address,
  });
}

export function useSearch(query: string) {
  const network = useNetwork();
  return useQuery<ApiResponse<Array<{ type: SearchResultType; data: unknown }>>>({
    queryKey: ["search", network, query],
    queryFn: () =>
      fetchApi<Array<{ type: SearchResultType; data: unknown }>>(`/api/v1/search?q=${encodeURIComponent(query)}`, network),
    enabled: query.length > 0,
  });
}

export function useStatsHistory(limit = 50) {
  const network = useNetwork();
  return useQuery<ApiResponse<NetworkSnapshot[]>>({
    queryKey: ["stats-history", network, limit],
    queryFn: () => fetchApi<NetworkSnapshot[]>(`/api/v1/stats/history?limit=${limit}`, network),
  });
}
