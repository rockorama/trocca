ALTER TABLE "items" ADD COLUMN "section" text;--> statement-breakpoint
ALTER TABLE "trade_items" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_score_range" CHECK ("ratings"."score" between 1 and 5);--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_no_self_rating" CHECK ("ratings"."rater_id" <> "ratings"."ratee_id");--> statement-breakpoint
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_quantity_positive" CHECK ("trade_items"."quantity" >= 1);--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_distinct_parties" CHECK ("trades"."proposer_id" <> "trades"."responder_id");--> statement-breakpoint
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_count_nonneg" CHECK ("user_items"."count" >= 0);