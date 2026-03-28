"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useDefinition } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddressDisplay } from "@/components/shared/address-display";
import { MetricCard } from "@/components/shared/metric-card";
import { Cpu, Code } from "lucide-react";
import Link from "next/link";

function DefinitionDetailContent() {
  const params = useParams();
  const network = useNetwork();
  const address = params.address as string;
  const { data: response, isLoading } = useDefinition(address);
  const def = response?.data as Record<string, unknown> | undefined;

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading definition\u2026</div>;
  }

  if (!def) {
    return <div className="flex min-h-[50vh] items-center justify-center text-text-muted">Definition not found</div>;
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/definitions?network=${network}`} className="text-sm text-text-muted hover:text-text-secondary">Definitions</Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-xl font-semibold text-text-primary">Definition</h1>
        <StatusBadge status={def.isCompleted ? "finalized" : "executing"} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="CU Amount" value={Number(def.cuAmount).toLocaleString()} icon={Cpu} />
        <MetricCard label="Circuit Length" value={Number(def.circuitLen)} icon={Code} />
        <MetricCard label="Source" value={String(def.sourceType)} />
      </div>

      <div className="rounded-lg border border-border-primary bg-bg-surface p-4 space-y-3">
        <h2 className="text-sm font-medium text-text-secondary">Details</h2>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Address</span>
            <AddressDisplay address={address} truncate={false} showExternalLink solanaExplorerNetwork={network === "mainnet" ? "mainnet-beta" : "devnet"} />
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Program</span>
            <Link href={`/programs/${def.mxeProgramId}?network=${network}`} className="text-accent-link hover:underline">
              <AddressDisplay address={String(def.mxeProgramId)} showCopy={false} />
            </Link>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Definition Offset</span>
            <span className="font-mono">{String(def.defOffset)}</span>
          </div>
        </div>
      </div>

      {!!def.parameters && (
        <div className="rounded-lg border border-border-primary bg-bg-surface p-4 space-y-3">
          <h2 className="text-sm font-medium text-text-secondary">Parameters</h2>
          <pre className="overflow-x-auto rounded bg-bg-elevated p-3 text-xs text-text-secondary font-mono">
            {JSON.stringify(def.parameters, null, 2)}
          </pre>
        </div>
      )}

      {!!def.outputs && (
        <div className="rounded-lg border border-border-primary bg-bg-surface p-4 space-y-3">
          <h2 className="text-sm font-medium text-text-secondary">Outputs</h2>
          <pre className="overflow-x-auto rounded bg-bg-elevated p-3 text-xs text-text-secondary font-mono">
            {JSON.stringify(def.outputs, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function DefinitionDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading\u2026</div>}>
      <DefinitionDetailContent />
    </Suspense>
  );
}
