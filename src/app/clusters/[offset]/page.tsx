"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useCluster } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddressDisplay } from "@/components/shared/address-display";
import { MetricCard } from "@/components/shared/metric-card";
import { Server, Cpu, Layers } from "lucide-react";
import Link from "next/link";

function ClusterDetailContent() {
  const params = useParams();
  const network = useNetwork();
  const offset = parseInt(params.offset as string, 10);
  const { data: response, isLoading } = useCluster(offset);
  const cluster = response?.data as Record<string, unknown> | undefined;
  const nodes = (cluster?.nodes || []) as Array<{
    offset: number;
    address: string;
    authorityKey: string;
    ip: string | null;
    isActive: boolean;
    cuCapacityClaim: number;
  }>;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
        Loading cluster\u2026
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
        Cluster not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/clusters?network=${network}`}
          className="text-sm text-text-muted hover:text-text-secondary"
        >
          Clusters
        </Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-2xl font-semibold text-text-primary">
          Cluster {offset}
        </h1>
        <StatusBadge
          status={cluster.isActive ? "active" : "inactive"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Cluster Size"
          value={Number(cluster.clusterSize)}
          icon={Layers}
        />
        <MetricCard
          label="Nodes"
          value={nodes.length}
          icon={Server}
        />
        <MetricCard
          label="Max Capacity"
          value={Number(cluster.maxCapacity)}
          icon={Cpu}
        />
        <MetricCard
          label="CU Price"
          value={Number(cluster.cuPrice).toLocaleString()}
        />
      </div>

      <div className="rounded-lg border border-border-primary bg-bg-surface p-4 space-y-3">
        <h2 className="text-sm font-medium text-text-secondary">Details</h2>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Address</span>
            <AddressDisplay
              address={String(cluster.address)}
              truncate={false}
              showExternalLink
              solanaExplorerNetwork={network === "mainnet" ? "mainnet-beta" : "devnet"}
            />
          </div>
          {!!cluster.blsPublicKey && (
            <div className="flex justify-between">
              <span className="text-text-muted">BLS Public Key</span>
              <AddressDisplay address={String(cluster.blsPublicKey)} chars={8} />
            </div>
          )}
        </div>
      </div>

      {/* Node list */}
      <div className="rounded-lg border border-border-primary bg-bg-surface p-4 space-y-3">
        <h2 className="text-sm font-medium text-text-secondary">
          Cluster Nodes ({nodes.length})
        </h2>
        {nodes.length === 0 ? (
          <p className="text-sm text-text-muted">No nodes in this cluster</p>
        ) : (
          <div className="space-y-2">
            {nodes.map((node) => (
              <Link
                key={node.offset}
                href={`/nodes/${node.offset}?network=${network}`}
                className="flex items-center justify-between rounded-md border border-border-muted p-3 hover:bg-bg-elevated/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-accent-link">
                    #{node.offset}
                  </span>
                  <AddressDisplay address={node.address} showCopy={false} />
                  {node.ip && (
                    <span className="text-xs text-text-muted">{node.ip}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">
                    CU: {node.cuCapacityClaim}
                  </span>
                  <StatusBadge
                    status={node.isActive ? "active" : "inactive"}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClusterDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading\u2026</div>}>
      <ClusterDetailContent />
    </Suspense>
  );
}
