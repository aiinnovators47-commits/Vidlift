-- Create credits table in Supabase
-- Run this SQL in your Supabase SQL Editor

-- Drop table if exists (be careful with this in production!)
-- DROP TABLE IF EXISTS credits CASCADE;
-- DROP TABLE IF EXISTS credit_transactions CASCADE;

-- Create credits table
CREATE TABLE IF NOT EXISTS credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_transactions table for tracking credit history
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Negative for deduction, positive for addition
  feature TEXT NOT NULL, -- Which feature was used (e.g., 'video_info', 'channel_info', 'compare')
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_email) REFERENCES credits(user_email) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credits_user_email ON credits(user_email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_email ON credit_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own credits
CREATE POLICY "Users can read their own credits"
  ON credits
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Policy: Users can read their own credit transactions
CREATE POLICY "Users can read their own transactions"
  ON credit_transactions
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Policy: Service role can insert/update credits (for API)
-- Note: Service role bypasses RLS, but we add this for clarity
CREATE POLICY "Service role can manage credits"
  ON credits
  FOR ALL
  USING (true);

CREATE POLICY "Service role can manage transactions"
  ON credit_transactions
  FOR ALL
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for credits table
DROP TRIGGER IF EXISTS update_credits_updated_at ON credits;
CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data (optional, remove in production)
-- INSERT INTO credits (user_email, credits) VALUES ('test@example.com', 100) ON CONFLICT (user_email) DO NOTHING;

COMMENT ON TABLE credits IS 'Stores user credit balances for the application';
COMMENT ON TABLE credit_transactions IS 'Stores credit transaction history for audit purposes';
