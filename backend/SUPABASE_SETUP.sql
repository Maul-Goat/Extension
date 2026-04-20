-- Jalankan ini di Supabase SQL Editor
-- https://supabase.com → project → SQL Editor

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Row Level Security (nonaktifkan karena kita pakai service key)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
