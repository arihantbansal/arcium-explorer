"use client";

import { useState, useCallback } from "react";
import { cn, truncateAddress } from "@/lib/utils";
import { Copy, Check, ExternalLink } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
  chars?: number;
  href?: string;
  mono?: boolean;
  className?: string;
  showCopy?: boolean;
  showExternalLink?: boolean;
  solanaExplorerNetwork?: "devnet" | "mainnet-beta";
  /** "account" (default) or "tx" — controls the Solscan URL path */
  linkType?: "account" | "tx";
}

export function AddressDisplay({
  address,
  truncate = true,
  chars = 4,
  href,
  mono = true,
  className,
  showCopy = true,
  showExternalLink = false,
  solanaExplorerNetwork,
  linkType = "account",
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address]);

  const truncatedText = truncate ? truncateAddress(address, chars) : address;

  const solanaUrl = solanaExplorerNetwork
    ? `https://solscan.io/${linkType}/${address}${solanaExplorerNetwork === "devnet" ? "?cluster=devnet" : ""}`
    : undefined;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        mono && "font-mono",
        className
      )}
    >
      {truncate ? (
        <>
          {/* Full address on md+, truncated on mobile */}
          <span className="hidden md:inline text-text-primary" title={address}>
            {address}
          </span>
          <span className="md:hidden text-text-primary" title={address}>
            {truncatedText}
          </span>
        </>
      ) : (
        <span className="text-text-primary" title={address}>
          {address}
        </span>
      )}
      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-text-muted hover:text-text-secondary transition-colors"
          title="Copy address"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
      {showExternalLink && solanaUrl && (
        <a
          href={solanaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-accent-link transition-colors"
          title="View on Solscan"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </span>
  );

  if (href) {
    return (
      <a href={href} className="hover:text-accent-link transition-colors">
        {content}
      </a>
    );
  }

  return content;
}
