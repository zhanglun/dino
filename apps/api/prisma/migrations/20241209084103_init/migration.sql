-- CreateTable
CREATE TABLE "wallets" (
    "id" SERIAL NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    "emoji" VARCHAR(10) NOT NULL DEFAULT 'fluent-emoji:beaming-face-with-smiling-eyes',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "token_address" VARCHAR(42) NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "decimals" INTEGER NOT NULL,
    "value" DECIMAL(78,18) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_history" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "total_value" DECIMAL(78,18) NOT NULL,
    "assets" JSONB NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "assets_wallet_id_token_address_idx" ON "assets"("wallet_id", "token_address");

-- CreateIndex
CREATE INDEX "assets_timestamp_idx" ON "assets"("timestamp");

-- CreateIndex
CREATE INDEX "asset_history_wallet_id_timestamp_idx" ON "asset_history"("wallet_id", "timestamp");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
