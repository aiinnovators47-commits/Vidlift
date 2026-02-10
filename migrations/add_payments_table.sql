-- Payments table for tracking Razorpay transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(100),
  plan_id VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL, -- Amount in paise
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT fk_user_email FOREIGN KEY (user_email) 
    REFERENCES auth.users(email) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_payments_user_email ON payments(user_email);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON payments(status);
