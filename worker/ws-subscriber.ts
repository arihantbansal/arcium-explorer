import { Connection } from "@solana/web3.js";
import { ARCIUM_PROGRAM } from "@/lib/indexer/sdk-adapter";
import { processAccountUpdate } from "./account-processor";
import { createLogger } from "@/lib/logger";
import { sleep } from "./utils";
import type { Network } from "@/types";

const log = createLogger("ws");

export interface WsSubscriberConfig {
  rpcUrl: string;
  wsUrl?: string;
  network: Network;
  watchdogMs?: number;
}

export class WsSubscriber {
  private rpcUrl: string;
  private wsUrl: string | undefined;
  private network: Network;
  private watchdogMs: number;
  private running = false;
  private reconnectDelay = 1000;
  private readonly MAX_RECONNECT_DELAY = 60_000;
  private connection: Connection | null = null;
  private subscriptionId: number | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private teardownResolve: (() => void) | null = null;
  private accountsProcessed = 0;

  constructor(config: WsSubscriberConfig) {
    this.rpcUrl = config.rpcUrl;
    this.wsUrl = config.wsUrl;
    this.network = config.network;
    this.watchdogMs = config.watchdogMs ?? 120_000;
  }

  async start(): Promise<void> {
    this.running = true;
    log.info("WS subscriber starting", {
      rpcUrl: this.rpcUrl,
      wsUrl: this.wsUrl ?? "(derived from rpcUrl)",
      network: this.network,
      watchdogMs: this.watchdogMs,
    });

    while (this.running) {
      try {
        await this.subscribe();
      } catch (error) {
        if (!this.running) break;

        const msg = error instanceof Error ? error.message : String(error);
        log.error("WS subscription error, reconnecting", {
          error: msg,
          retryInMs: this.reconnectDelay,
        });
        await sleep(this.reconnectDelay);
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2,
          this.MAX_RECONNECT_DELAY,
        );
      }
    }

    log.info("WS subscriber stopped");
  }

  private createConnection(): Connection {
    const opts: { commitment: "confirmed"; wsEndpoint?: string } = {
      commitment: "confirmed",
    };
    if (this.wsUrl) {
      opts.wsEndpoint = this.wsUrl;
    }
    return new Connection(this.rpcUrl, opts);
  }

  private resetWatchdog(): void {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    if (!this.running) return;
    this.watchdogTimer = setTimeout(() => {
      log.warn("WS watchdog: no updates received, forcing reconnect", {
        watchdogMs: this.watchdogMs,
        network: this.network,
      });
      this.teardown();
    }, this.watchdogMs);
  }

  private teardown(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.connection && this.subscriptionId !== null) {
      this.connection
        .removeAccountChangeListener(this.subscriptionId)
        .catch((err) => log.debug("Failed to remove WS listener", {
          error: err instanceof Error ? err.message : String(err),
        }));
      this.subscriptionId = null;
    }
    this.connection = null;

    // Signal subscribe() Promise to resolve (replaces polling interval)
    if (this.teardownResolve) {
      this.teardownResolve();
      this.teardownResolve = null;
    }
  }

  private subscribe(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.connection = this.createConnection();
        this.teardownResolve = resolve;

        this.subscriptionId = this.connection.onProgramAccountChange(
          ARCIUM_PROGRAM,
          async (keyedAccountInfo, context) => {
            try {
              this.resetWatchdog();

              const address = keyedAccountInfo.accountId.toBase58();
              const data = keyedAccountInfo.accountInfo.data;

              await processAccountUpdate({
                address,
                data,
                network: this.network,
                slot: context.slot,
              });

              this.accountsProcessed++;
              if (this.accountsProcessed % 50 === 0) {
                log.info("WS accounts processed", {
                  count: this.accountsProcessed,
                  network: this.network,
                  slot: context.slot,
                });
              }
            } catch (error) {
              log.error("Error processing WS update", {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          },
          "confirmed",
        );

        this.reconnectDelay = 1000;
        this.resetWatchdog();

        log.info("WS subscription active", {
          program: ARCIUM_PROGRAM.toBase58(),
          network: this.network,
          subscriptionId: this.subscriptionId,
        });
      } catch (error) {
        this.teardownResolve = null;
        reject(error);
      }
    });
  }

  stop(): void {
    this.running = false;
    this.teardown();
    log.info("WS subscriber stop requested");
  }
}
