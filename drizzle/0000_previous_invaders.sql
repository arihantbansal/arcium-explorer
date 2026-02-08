CREATE TYPE "public"."computation_status" AS ENUM('queued', 'executing', 'finalized', 'failed');--> statement-breakpoint
CREATE TYPE "public"."network" AS ENUM('devnet', 'mainnet');--> statement-breakpoint
CREATE TABLE "arx_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(64) NOT NULL,
	"offset" integer NOT NULL,
	"authority_key" varchar(64) NOT NULL,
	"ip" varchar(64),
	"location" varchar(128),
	"cluster_offset" integer,
	"cu_capacity_claim" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"bls_public_key" varchar(256),
	"x25519_public_key" varchar(128),
	"network" "network" DEFAULT 'devnet' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clusters" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(64) NOT NULL,
	"offset" integer NOT NULL,
	"cluster_size" integer DEFAULT 0 NOT NULL,
	"max_capacity" integer DEFAULT 0 NOT NULL,
	"cu_price" bigint DEFAULT 0 NOT NULL,
	"node_offsets" jsonb DEFAULT '[]'::jsonb,
	"bls_public_key" varchar(256),
	"is_active" boolean DEFAULT false NOT NULL,
	"network" "network" DEFAULT 'devnet' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "computation_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(64) NOT NULL,
	"mxe_program_id" varchar(64) NOT NULL,
	"def_offset" integer NOT NULL,
	"cu_amount" integer DEFAULT 0 NOT NULL,
	"circuit_len" integer DEFAULT 0 NOT NULL,
	"source_type" varchar(32) DEFAULT 'onchain' NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"parameters" jsonb,
	"outputs" jsonb,
	"network" "network" DEFAULT 'devnet' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "computations" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(64) NOT NULL,
	"computation_offset" varchar(32) NOT NULL,
	"cluster_offset" integer NOT NULL,
	"payer" varchar(64) NOT NULL,
	"mxe_program_id" varchar(64),
	"status" "computation_status" DEFAULT 'queued' NOT NULL,
	"queued_at" timestamp,
	"executing_at" timestamp,
	"finalized_at" timestamp,
	"failed_at" timestamp,
	"queue_tx_sig" varchar(128),
	"finalize_tx_sig" varchar(128),
	"network" "network" DEFAULT 'devnet' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indexer_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"last_processed_slot" bigint DEFAULT 0 NOT NULL,
	"status" varchar(32) DEFAULT 'idle' NOT NULL,
	"last_run_at" timestamp,
	"error_message" text,
	"network" "network" DEFAULT 'devnet' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mxe_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(64) NOT NULL,
	"mxe_program_id" varchar(64) NOT NULL,
	"cluster_offset" integer,
	"authority" varchar(64),
	"x25519_pubkey" varchar(128),
	"comp_def_offsets" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"network" "network" DEFAULT 'devnet' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"total_clusters" integer DEFAULT 0 NOT NULL,
	"active_nodes" integer DEFAULT 0 NOT NULL,
	"total_computations" integer DEFAULT 0 NOT NULL,
	"computations_per_min" real DEFAULT 0 NOT NULL,
	"network" "network" DEFAULT 'devnet' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" varchar(64) NOT NULL,
	"mxe_address" varchar(64) NOT NULL,
	"comp_def_count" integer DEFAULT 0 NOT NULL,
	"computation_count" integer DEFAULT 0 NOT NULL,
	"network" "network" DEFAULT 'devnet' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "arx_nodes_offset_network_idx" ON "arx_nodes" USING btree ("offset","network");--> statement-breakpoint
CREATE INDEX "arx_nodes_network_idx" ON "arx_nodes" USING btree ("network");--> statement-breakpoint
CREATE INDEX "arx_nodes_cluster_idx" ON "arx_nodes" USING btree ("cluster_offset","network");--> statement-breakpoint
CREATE INDEX "arx_nodes_active_idx" ON "arx_nodes" USING btree ("is_active","network");--> statement-breakpoint
CREATE UNIQUE INDEX "clusters_offset_network_idx" ON "clusters" USING btree ("offset","network");--> statement-breakpoint
CREATE INDEX "clusters_network_idx" ON "clusters" USING btree ("network");--> statement-breakpoint
CREATE INDEX "clusters_active_idx" ON "clusters" USING btree ("is_active","network");--> statement-breakpoint
CREATE UNIQUE INDEX "comp_defs_address_network_idx" ON "computation_definitions" USING btree ("address","network");--> statement-breakpoint
CREATE INDEX "comp_defs_program_idx" ON "computation_definitions" USING btree ("mxe_program_id","network");--> statement-breakpoint
CREATE INDEX "comp_defs_network_idx" ON "computation_definitions" USING btree ("network");--> statement-breakpoint
CREATE UNIQUE INDEX "computations_address_network_idx" ON "computations" USING btree ("address","network");--> statement-breakpoint
CREATE INDEX "computations_status_idx" ON "computations" USING btree ("status","network");--> statement-breakpoint
CREATE INDEX "computations_cluster_idx" ON "computations" USING btree ("cluster_offset","network");--> statement-breakpoint
CREATE INDEX "computations_payer_idx" ON "computations" USING btree ("payer","network");--> statement-breakpoint
CREATE INDEX "computations_program_idx" ON "computations" USING btree ("mxe_program_id","network");--> statement-breakpoint
CREATE INDEX "computations_network_idx" ON "computations" USING btree ("network");--> statement-breakpoint
CREATE UNIQUE INDEX "indexer_state_entity_network_idx" ON "indexer_state" USING btree ("entity_type","network");--> statement-breakpoint
CREATE UNIQUE INDEX "mxe_accounts_address_network_idx" ON "mxe_accounts" USING btree ("address","network");--> statement-breakpoint
CREATE INDEX "mxe_accounts_program_idx" ON "mxe_accounts" USING btree ("mxe_program_id","network");--> statement-breakpoint
CREATE INDEX "mxe_accounts_network_idx" ON "mxe_accounts" USING btree ("network");--> statement-breakpoint
CREATE INDEX "snapshots_time_idx" ON "network_snapshots" USING btree ("timestamp","network");--> statement-breakpoint
CREATE INDEX "snapshots_network_idx" ON "network_snapshots" USING btree ("network");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_id_network_idx" ON "programs" USING btree ("program_id","network");--> statement-breakpoint
CREATE INDEX "programs_network_idx" ON "programs" USING btree ("network");