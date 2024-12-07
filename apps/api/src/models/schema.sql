-- 创建钱包表
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    emoji VARCHAR(10) DEFAULT '💰',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建资产表
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    token_address VARCHAR(42) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL, -- 支持大数字
    decimals INTEGER NOT NULL,
    value NUMERIC(78, 18) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建资产历史记录表
CREATE TABLE asset_history (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
    total_value NUMERIC(78, 18) NOT NULL,
    assets JSONB NOT NULL, -- 存储资产快照
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引
CREATE INDEX idx_wallets_address ON wallets(address);
CREATE INDEX idx_assets_wallet_token ON assets(wallet_id, token_address);
CREATE INDEX idx_assets_timestamp ON assets(timestamp);
CREATE INDEX idx_asset_history_wallet_timestamp ON asset_history(wallet_id, timestamp);

-- 创建视图：钱包资产汇总
CREATE VIEW wallet_summaries AS
SELECT 
    w.id AS wallet_id,
    w.address,
    w.name,
    COUNT(DISTINCT a.chain_id) AS chain_count,
    COUNT(DISTINCT a.token_address) AS token_count,
    SUM(a.value) AS total_value
FROM wallets w
LEFT JOIN assets a ON w.id = a.wallet_id
GROUP BY w.id, w.address, w.name;
