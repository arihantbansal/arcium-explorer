"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, Menu, X } from "lucide-react";
import type { Network } from "@/types";
import { DEFAULT_NETWORK } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/clusters", label: "Clusters" },
  { href: "/nodes", label: "Nodes" },
  { href: "/computations", label: "Computations" },
  { href: "/programs", label: "Programs" },
  { href: "/mxes", label: "MXEs" },
];

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const network = (searchParams.get("network") as Network) || DEFAULT_NETWORK;

  const toggleNetwork = useCallback(() => {
    const newNetwork = network === "devnet" ? "mainnet" : "devnet";
    const params = new URLSearchParams(searchParams.toString());
    params.set("network", newNetwork);
    router.push(`${pathname}?${params.toString()}`);
  }, [network, pathname, searchParams, router]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&network=${network}`);
        setSearchOpen(false);
        setSearchQuery("");
      }
    },
    [searchQuery, network, router]
  );

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-primary bg-bg-primary/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          {/* Logo */}
          <Link
            href={`/?network=${network}`}
            className="flex items-center gap-2 font-semibold text-text-primary"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-arcium/20">
              <span className="text-sm font-bold text-accent-arcium">A</span>
            </div>
            <span className="hidden sm:inline">Arcium Explorer</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`${item.href}?network=${network}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "bg-bg-elevated text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-md border border-border-primary bg-bg-surface px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline rounded border border-border-primary bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
                {"\u2318"}K
              </kbd>
            </button>

            {/* Network toggle */}
            <button
              onClick={toggleNetwork}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                network === "devnet"
                  ? "border-status-executing/30 bg-status-executing/10 text-status-executing"
                  : "border-status-queued/30 bg-status-queued/10 text-status-queued"
              )}
            >
              {network === "devnet" ? "Devnet" : "Mainnet"}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-md p-1.5 text-text-secondary hover:text-text-primary"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border-primary bg-bg-surface px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`${item.href}?network=${network}`}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "bg-bg-elevated text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm">
          <div className="mx-auto mt-[20vh] max-w-lg px-4">
            <form
              onSubmit={handleSearch}
              className="rounded-xl border border-border-primary bg-bg-surface p-2 shadow-lg"
            >
              <div className="flex items-center gap-3 px-3">
                <Search className="h-5 w-5 text-text-muted" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by address, tx sig, offset..."
                  className="flex-1 bg-transparent py-3 text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
                <kbd className="rounded border border-border-primary bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
                  ESC
                </kbd>
              </div>
            </form>
          </div>
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setSearchOpen(false)}
          />
        </div>
      )}
    </>
  );
}
