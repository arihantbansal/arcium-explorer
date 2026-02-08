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
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address]);

  const displayText = truncate ? truncateAddress(address, chars) : address;

  const solanaUrl = solanaExplorerNetwork
    ? `https://explorer.solana.com/address/${address}?cluster=${solanaExplorerNetwork}`
    : undefined;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        mono && "font-mono",
        className
      )}
    >
      <span className="text-text-primary" title={address}>
        {displayText}
      </span>
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
          title="View on Solana Explorer"
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
