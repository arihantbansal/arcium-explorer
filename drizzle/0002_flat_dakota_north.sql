ALTER TABLE "arx_nodes" ALTER COLUMN "offset" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "arx_nodes" ALTER COLUMN "cluster_offset" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "arx_nodes" ALTER COLUMN "cu_capacity_claim" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "clusters" ALTER COLUMN "offset" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "clusters" ALTER COLUMN "max_capacity" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "computation_definitions" ALTER COLUMN "def_offset" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "computation_definitions" ALTER COLUMN "cu_amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "computation_definitions" ALTER COLUMN "circuit_len" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "computations" ALTER COLUMN "cluster_offset" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "mxe_accounts" ALTER COLUMN "cluster_offset" SET DATA TYPE bigint;