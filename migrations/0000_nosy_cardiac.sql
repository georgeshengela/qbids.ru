CREATE TYPE "public"."auction_status" AS ENUM('upcoming', 'live', 'finished');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "auction_bots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" varchar NOT NULL,
	"bot_id" varchar NOT NULL,
	"bid_limit" integer DEFAULT 0 NOT NULL,
	"current_bids" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"retail_price" numeric(10, 2) NOT NULL,
	"current_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"bid_increment" numeric(10, 2) DEFAULT '0.01' NOT NULL,
	"status" "auction_status" DEFAULT 'upcoming' NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"timer_seconds" integer DEFAULT 10 NOT NULL,
	"winner_id" varchar,
	"is_bid_package" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" varchar NOT NULL,
	"user_id" varchar,
	"bot_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"min_delay" integer DEFAULT 5 NOT NULL,
	"max_delay" integer DEFAULT 6 NOT NULL,
	"default_bid_limit" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bots_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "prebids" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency" text DEFAULT 'сом' NOT NULL,
	"currency_symbol" text DEFAULT 'сом' NOT NULL,
	"site_name" text DEFAULT 'QBIDS.KG' NOT NULL,
	"language" text DEFAULT 'ru' NOT NULL,
	"header_tagline" text DEFAULT 'Пенни-аукционы в Кыргызстане',
	"footer_description" text DEFAULT 'Первая пенни-аукционная платформа в Кыргызстане. Выигрывайте премиальные товары за копейки с нашей честной и прозрачной системой аукционов.',
	"contact_address" text DEFAULT 'г. Бишкек, ул. Чуй 154',
	"contact_phone" text DEFAULT '+996 (555) 123-456',
	"contact_email" text DEFAULT 'info@qbids.kg',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text,
	"last_name" text,
	"username" text NOT NULL,
	"email" text,
	"phone" text,
	"password" text NOT NULL,
	"date_of_birth" timestamp,
	"gender" "gender",
	"bid_balance" integer DEFAULT 0 NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "auction_bots" ADD CONSTRAINT "auction_bots_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_bots" ADD CONSTRAINT "auction_bots_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prebids" ADD CONSTRAINT "prebids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prebids" ADD CONSTRAINT "prebids_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");