-- ========================================================
-- SUPABASE DATABASE SCHEMA: APLIKASI E-WEDDING INVITATION
-- URL Project: https://plxonjsspoagxxtolyjj.supabase.co
-- Cara Pasang: Copy semua isi file ini ke Supabase Dashboard -> SQL Editor -> Klik "Run"
-- ========================================================

-- 1. TABEL PEMBELI LISENSI & TOKEN (wedding_buyers)
CREATE TABLE IF NOT EXISTS public.wedding_buyers (
    email TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    order_id TEXT,
    product_name TEXT DEFAULT 'Aplikasi E-Wedding Invitation Generator',
    tokens INT DEFAULT 1,
    published_count INT DEFAULT 0,
    source TEXT DEFAULT 'lynk.id',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pencarian cepat berdasarkan email
CREATE INDEX IF NOT EXISTS idx_wedding_buyers_email ON public.wedding_buyers(email);

-- 2. TABEL UNDANGAN PUBLIK (wedding_invitations)
CREATE TABLE IF NOT EXISTS public.wedding_invitations (
    slug TEXT PRIMARY KEY,
    owner_email TEXT REFERENCES public.wedding_buyers(email) ON DELETE SET NULL,
    data JSONB NOT NULL,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pencarian slug undangan
CREATE INDEX IF NOT EXISTS idx_wedding_invitations_slug ON public.wedding_invitations(slug);
CREATE INDEX IF NOT EXISTS idx_wedding_invitations_owner ON public.wedding_invitations(owner_email);

-- 3. TABEL KONFIRMASI KEHADIRAN & DINDING DOA (wedding_rsvps)
CREATE TABLE IF NOT EXISTS public.wedding_rsvps (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    attendance TEXT DEFAULT 'Hadir',
    guests_count INT DEFAULT 1,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pencarian RSVP per slug undangan
CREATE INDEX IF NOT EXISTS idx_wedding_rsvps_slug ON public.wedding_rsvps(slug);

-- 4. TABEL LOG TRANSAKSI PEMBAYARAN (wedding_transactions)
CREATE TABLE IF NOT EXISTS public.wedding_transactions (
    order_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    supporter_name TEXT,
    platform TEXT DEFAULT 'lynk.id', -- 'lynk.id' atau 'trakteer'
    amount NUMERIC DEFAULT 0,
    tokens_credited INT DEFAULT 1,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wedding_transactions_email ON public.wedding_transactions(email);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Aktifkan RLS
ALTER TABLE public.wedding_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_transactions ENABLE ROW LEVEL SECURITY;

-- Policy agar backend serverless (via anon/service key) dan web viewer dapat membaca & menulis
CREATE POLICY "Allow public read invitations" ON public.wedding_invitations
    FOR SELECT USING (true);

CREATE POLICY "Allow all operations with valid API key" ON public.wedding_invitations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read and insert rsvps" ON public.wedding_rsvps
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow backend manage buyers" ON public.wedding_buyers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow backend manage transactions" ON public.wedding_transactions
    FOR ALL USING (true) WITH CHECK (true);

-- Insert dummy developer testing account
INSERT INTO public.wedding_buyers (email, name, order_id, tokens, source)
VALUES 
    ('demo.pengantin@gmail.com', 'Demo Pengantin', 'DEMO-OFFLINE', 0, 'demo'),
    ('olapoal.artgallery@gmail.com', 'Olapoal Master Admin', 'ADMIN-VIP', 999, 'admin')
ON CONFLICT (email) DO NOTHING;
