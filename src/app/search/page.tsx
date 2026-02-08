"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSearch } from "@/lib/hooks/use-api";
import { useNetwork } from "@/lib/hooks/use-network";
import { AddressDisplay } from "@/components/shared/address-display";
import Link from "next/link";
import { Layers, Server, Cpu, Code, Shield } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: typeof Layers; label: string; href: (data: Record<string, unknown>, network: string) => string }> = {
  cluster: {
    icon: Layers,
    label: "Cluster",
    href: (d, n) => `/clusters/${d.offset}?network=${n}`,
  },
  node: {
    icon: Server,
    label: "Node",
    href: (d, n) => `/nodes/${d.offset}?network=${n}`,
  },
  computation: {
    icon: Cpu,
    label: "Computation",
    href: (d, n) => `/computations/${d.address}?network=${n}`,
  },
  program: {
    icon: Code,
    label: "Program",
    href: (d, n) => `/programs/${d.programId}?network=${n}`,
  },
  mxe: {
    icon: Shield,
    label: "MXE",
    href: (d, n) => `/mxes/${d.address}?network=${n}`,
  },
};

function SearchContent() {
  const searchParams = useSearchParams();
  const network = useNetwork();
  const query = searchParams.get("q") || "";
  const { data: response, isLoading } = useSearch(query);
  const results = (response?.data || []) as Array<{
    type: string;
    data: Record<string, unknown>;
  }>;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Search Results
        </h1>
        {query && (
          <p className="mt-1 text-sm text-text-secondary">
            Results for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-text-muted">
          Searching...
        </div>
      ) : results.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-text-muted">
          {query ? "No results found" : "Enter a search query"}
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((result, i) => {
            const config = TYPE_CONFIG[result.type];
            if (!config) return null;
            const Icon = config.icon;
            const address = String(result.data.address || result.data.programId || "");

            return (
              <Link
                key={`${result.type}-${i}`}
                href={config.href(result.data, network)}
                className="flex items-center gap-4 rounded-lg border border-border-primary bg-bg-surface p-4 hover:bg-bg-elevated/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-arcium/10">
                  <Icon className="h-5 w-5 text-accent-arcium" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-accent-arcium uppercase">
                      {config.label}
                    </span>
                    {result.data.offset !== undefined && (
                      <span className="text-xs text-text-muted">
                        #{String(result.data.offset)}
                      </span>
                    )}
                  </div>
                  {address && (
                    <AddressDisplay
                      address={address}
                      truncate={false}
                      showCopy={false}
                      className="mt-0.5 text-sm"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-text-muted">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
