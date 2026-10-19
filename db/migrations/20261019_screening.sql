-- Apply ONCE to an existing D1 inquiries table before deploying the new Worker.
ALTER TABLE inquiries ADD COLUMN screening TEXT NOT NULL DEFAULT 'clear';
ALTER TABLE inquiries ADD COLUMN screening_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN screening_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_inquiries_screening ON inquiries(screening);