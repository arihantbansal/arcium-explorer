"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useNode } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddressDisplay } from "@/components/shared/address-display";
import { MetricCard } from "@/components/shared/metric-card";
import { Cpu, Server } from "lucide-react";
import Link from "next/link";

function NodeDetailContent() {
  const params = useParams();
  const network = useNetwork();
  const offset = parseInt(params.offset as string, 10);
  const { data: response, isLoading } = useNode(offset);
  const node = response?.data as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
        Loading node\u2026
      </div>
    );
  }

  if (!node) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
        Node not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/nodes?network=${network}`}
          className="text-sm text-text-muted hover:text-text-secondary"
        >
          Nodes
        </Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-2xl font-semibold text-text-primary">
          Node #{offset}
        </h1>
        <StatusBadge status={node.isActive ? "active" : "inactive"} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard
          label="CU Capacity"
          value={Number(node.cuCapacityClaim).toLocaleString()}
          icon={Cpu}
        />
        <MetricCard
          label="Cluster"
          value={node.clusterOffset !== null ? String(node.clusterOffset) : "None"}
          icon={Server}
        />
        <MetricCard
          label="IP Address"
          value={String(node.ip || "N/A")}
        />
      </div>

      <div className="rounded-lg border border-border-primary bg-bg-surface p-4 space-y-3">
        <h2 className="text-sm font-medium text-text-secondary">Details</h2>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Address</span>
            <AddressDisplay
              address={String(node.address)}
              truncate={false}
              showExternalLink
              solanaExplorerNetwork={network === "mainnet" ? "mainnet-beta" : "devnet"}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Authority</span>
            <AddressDisplay address={String(node.authorityKey)} />
          </div>
          {node.clusterOffset !== null && (
            <div className="flex justify-between">
              <span className="text-text-muted">Cluster</span>
              <Link
                href={`/clusters/${node.clusterOffset}?network=${network}`}
                className="font-mono text-accent-link hover:underline"
              >
                Cluster {String(node.clusterOffset)}
              </Link>
            </div>
          )}
          {!!node.location && (
            <div className="flex justify-between">
              <span className="text-text-muted">Location</span>
              <span>{String(node.location)}</span>
            </div>
          )}
          {!!node.x25519PublicKey && (
            <div className="flex justify-between">
              <span className="text-text-muted">x25519 Key</span>
              <AddressDisplay address={String(node.x25519PublicKey)} chars={8} />
            </div>
          )}
          {!!node.blsPublicKey && (
            <div className="flex justify-between">
              <span className="text-text-muted">BLS Key</span>
              <AddressDisplay address={String(node.blsPublicKey)} chars={8} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NodeDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading\u2026</div>}>
      <NodeDetailContent />
    </Suspense>
  );
}
