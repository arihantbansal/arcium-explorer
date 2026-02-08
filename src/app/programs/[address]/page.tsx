"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useProgram } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { AddressDisplay } from "@/components/shared/address-display";
import { MetricCard } from "@/components/shared/metric-card";
import { Code, Cpu, Shield } from "lucide-react";
import Link from "next/link";

function ProgramDetailContent() {
  const params = useParams();
  const network = useNetwork();
  const address = params.address as string;
  const { data: response, isLoading } = useProgram(address);
  const program = response?.data as Record<string, unknown> | undefined;
  const compDefs = (program?.computationDefinitions || []) as Array<{
    address: string;
    defOffset: number;
    cuAmount: number;
    isCompleted: boolean;
    sourceType: string;
  }>;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
        Loading program...
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-text-muted">
        Program not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/programs?network=${network}`}
          className="text-sm text-text-muted hover:text-text-secondary"
        >
          Programs
        </Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-xl font-semibold text-text-primary">Program</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Definitions" value={Number(program.compDefCount)} icon={Code} />
        <MetricCard label="Computations" value={Number(program.computationCount).toLocaleString()} icon={Cpu} />
        <MetricCard label="MXE" value="Active" icon={Shield} />
      </div>

      <div className="rounded-lg border border-border-primary bg-bg-surface p-4 space-y-3">
        <h2 className="text-sm font-medium text-text-secondary">Details</h2>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Program ID</span>
            <AddressDisplay address={address} truncate={false} showExternalLink solanaExplorerNetwork={network === "mainnet" ? "mainnet-beta" : "devnet"} />
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">MXE Address</span>
            <Link href={`/mxes/${program.mxeAddress}?network=${network}`} className="text-accent-link hover:underline">
              <AddressDisplay address={String(program.mxeAddress)} showCopy={false} />
            </Link>
          </div>
        </div>
      </div>

      {compDefs.length > 0 && (
        <div className="rounded-lg border border-border-primary bg-bg-surface p-4 space-y-3">
          <h2 className="text-sm font-medium text-text-secondary">
            Computation Definitions ({compDefs.length})
          </h2>
          <div className="space-y-2">
            {compDefs.map((def) => (
              <Link
                key={def.address}
                href={`/definitions/${def.address}?network=${network}`}
                className="flex items-center justify-between rounded-md border border-border-muted p-3 hover:bg-bg-elevated/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AddressDisplay address={def.address} showCopy={false} />
                  <span className="text-xs text-text-muted">
                    Offset: {def.defOffset}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>CU: {def.cuAmount}</span>
                  <span>{def.sourceType}</span>
                  <span className={def.isCompleted ? "text-status-queued" : "text-status-executing"}>
                    {def.isCompleted ? "Completed" : "Pending"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProgramDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading...</div>}>
      <ProgramDetailContent />
    </Suspense>
  );
}
