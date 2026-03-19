-- Early access request tracking
-- Stores emails of users who want to join the early access program

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  invite_code_sent VARCHAR(12)
);

-- Index for quick lookups
CREATE INDEX idx_access_requests_email ON access_requests(email);
CREATE INDEX idx_access_requests_status ON access_requests(status);

-- Enable RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify access requests
CREATE POLICY "Admins can manage access requests" ON access_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Anyone can insert a request (for the public endpoint)
CREATE POLICY "Anyone can request access" ON access_requests
  FOR INSERT WITH CHECK (true);
