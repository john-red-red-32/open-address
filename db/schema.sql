CREATE TABLE IF NOT EXISTS inquiries (
 id TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL,
 sender TEXT NOT NULL,
 sender_kind TEXT NOT NULL,
 subject TEXT NOT NULL,
 message TEXT NOT NULL,
 contact TEXT,
 status TEXT NOT NULL DEFAULT 'received',
 response TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now')),
 user_agent TEXT,
 channel TEXT NOT NULL DEFAULT 'http'
);
CREATE TABLE IF NOT EXISTS daily_limits (
 fingerprint TEXT NOT NULL,
 day TEXT NOT NULL,
 hits INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(fingerprint,day)
);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);