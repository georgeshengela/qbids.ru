-- Create transaction_status enum
DO $$ BEGIN
  CREATE TYPE "transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "user_email" text,
  "digiseller_invoice_id" text,
  "digiseller_product_id" text,
  "amount" numeric(10, 2) NOT NULL,
  "currency" text DEFAULT 'KGS' NOT NULL,
  "bids_amount" integer NOT NULL,
  "status" "transaction_status" DEFAULT 'pending' NOT NULL,
  "payment_method" text,
  "error_message" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_transactions_user_id" ON "transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_invoice_id" ON "transactions" ("digiseller_invoice_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_status" ON "transactions" ("status");

