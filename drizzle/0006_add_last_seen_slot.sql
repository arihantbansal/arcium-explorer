ALTER TABLE "clusters" ADD COLUMN "last_seen_slot" bigint NOT NULL DEFAULT 0;
ALTER TABLE "arx_nodes" ADD COLUMN "last_seen_slot" bigint NOT NULL DEFAULT 0;
ALTER TABLE "mxe_accounts" ADD COLUMN "last_seen_slot" bigint NOT NULL DEFAULT 0;
