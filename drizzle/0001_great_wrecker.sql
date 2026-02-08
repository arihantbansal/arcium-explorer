DROP INDEX "arx_nodes_offset_network_idx";--> statement-breakpoint
DROP INDEX "clusters_offset_network_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "arx_nodes_address_network_idx" ON "arx_nodes" USING btree ("address","network");--> statement-breakpoint
CREATE UNIQUE INDEX "clusters_address_network_idx" ON "clusters" USING btree ("address","network");