-- ============================================================
-- CarryGoExpress — Full Database Schema & Realtime Setup
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- ── 1. Products table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  sku            TEXT,
  brand          TEXT DEFAULT 'CarryGoExpress',
  category       TEXT NOT NULL,
  price          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(12, 2),
  description    TEXT,
  image          TEXT,
  badge          TEXT,
  in_stock       BOOLEAN DEFAULT TRUE,
  stock          INTEGER DEFAULT 10,
  rating         NUMERIC(3, 1) DEFAULT 4.5,
  reviews        INTEGER DEFAULT 0,
  status         TEXT DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- If stock, sku, or subcategory column doesn't exist, add it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock') THEN
    ALTER TABLE public.products ADD COLUMN stock INTEGER DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sku') THEN
    ALTER TABLE public.products ADD COLUMN sku TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='subcategory') THEN
    ALTER TABLE public.products ADD COLUMN subcategory TEXT;
  END IF;
END $$;

-- ── 2. Profiles table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  city       TEXT,
  state      TEXT,
  avatar_url TEXT,
  role       TEXT DEFAULT 'customer',
  status     TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup (Safe with Exception handling)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Never let trigger failure crash user registration in auth.users
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 3. Orders table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status            TEXT DEFAULT 'pending', -- pending, processing, completed, cancelled
  payment_status    TEXT DEFAULT 'pending', -- pending, paid, failed
  payment_reference TEXT,
  payment_method    TEXT DEFAULT 'Card',
  total_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_address  TEXT,
  customer_name     TEXT,
  customer_email    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Order Items table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  product_image TEXT,
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit_price    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Transactions table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount      NUMERIC(12, 2) NOT NULL,
  status      TEXT DEFAULT 'success' CHECK (status IN ('pending', 'success', 'failed')),
  reference   TEXT UNIQUE,
  description TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Carts table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.carts (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items      JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. Activity / Notifications Log (Optional, for persistent admin stream) ──
CREATE TABLE IF NOT EXISTS public.app_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- order_created, order_updated, user_signup, deposit_created, product_updated
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. Site Visits & Realtime Traffic Tracking ──────────────
CREATE TABLE IF NOT EXISTS public.site_visits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address        TEXT,
  city              TEXT,
  region            TEXT,
  country           TEXT,
  country_code      TEXT,
  country_flag      TEXT,
  page_path         TEXT NOT NULL,
  page_title        TEXT,
  referrer          TEXT,
  user_agent        TEXT,
  browser           TEXT,
  os                TEXT,
  device_type       TEXT DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
  screen_resolution TEXT,
  session_id        TEXT,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_ip ON public.site_visits (ip_address);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON public.site_visits (page_path);

-- ============================================================
-- Row Level Security (RLS) Configuration
-- Designed for seamless User-end and Admin-end operation
-- ============================================================
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits  ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin (Non-recursive and strict)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. Check verified app_metadata or user_metadata role
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 2. Check exact authorized administrator email (exact match, prevents wildcard escalation)
  IF (auth.jwt() ->> 'email') = 'admin@carrygoexpress.com' THEN
    RETURN TRUE;
  END IF;

  -- 3. Check profiles table safely
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ── Profiles policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_modify_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;

-- Users can read their own profile; admins can read all customer profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Allow creating profiles (via signup trigger or authenticated registration)
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- Users can update their own profile; admins can update any profile (prevents self-elevation)
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR (role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

-- ── Products policies (Public can view, ONLY Admin can manage) ──
DROP POLICY IF EXISTS "products_read_policy" ON public.products;
DROP POLICY IF EXISTS "products_manage_policy" ON public.products;

CREATE POLICY "products_read_policy" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products_manage_policy" ON public.products
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Orders policies (User sees own, Admin sees all, Admin manages) ────────────
DROP POLICY IF EXISTS "orders_read_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_manage_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Order items policies (Strict parent order ownership) ───────
DROP POLICY IF EXISTS "order_items_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_manage_policy" ON public.order_items;

CREATE POLICY "order_items_select_policy" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY "order_items_insert_policy" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY "order_items_manage_policy" ON public.order_items
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Transactions policies (User sees own, Admin manages) ───────
DROP POLICY IF EXISTS "transactions_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_manage_policy" ON public.transactions;

CREATE POLICY "transactions_select_policy" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "transactions_insert_policy" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "transactions_manage_policy" ON public.transactions
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Carts policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "carts_policy" ON public.carts;

CREATE POLICY "carts_policy" ON public.carts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── App events policies ────────────────────────────────────────
DROP POLICY IF EXISTS "app_events_policy" ON public.app_events;

CREATE POLICY "app_events_policy" ON public.app_events
  FOR ALL USING (public.is_admin()) WITH CHECK (true);

-- ── Site Visits policies (Anyone can insert visit, ONLY Admin can view) ──
DROP POLICY IF EXISTS "site_visits_insert" ON public.site_visits;
DROP POLICY IF EXISTS "site_visits_select" ON public.site_visits;

CREATE POLICY "site_visits_insert" ON public.site_visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "site_visits_select" ON public.site_visits
  FOR SELECT USING (public.is_admin());

-- ============================================================
-- Enable Supabase Realtime for instant live tracking
-- ============================================================
DO $$
BEGIN
  -- Add tables to realtime publication if not already included
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visits;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================
-- Storage Buckets Setup (Public 'products' bucket)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Public Read Products Storage" ON storage.objects
      FOR SELECT USING (bucket_id = 'products');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "Allow Upload to Products Storage" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'products');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "Allow Modify Products Storage" ON storage.objects
      FOR ALL USING (bucket_id = 'products');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================
-- Seed initial CarryGoExpress products if table is empty
-- ============================================================
INSERT INTO public.products (name, sku, brand, category, price, original_price, description, image, badge, in_stock, stock, rating, reviews, status)
SELECT 
  name, sku, brand, category, price, original_price, description, image, badge, in_stock, stock, rating, reviews, status
FROM (VALUES
  ('CarryGo Hisense 55" ULED 4K Smart TV', 'CGO-TV-55U', 'CarryGoExpress', 'Televisions', 485000.00, 520000.00, 'Stunning 4K resolution with ULED quantum display technology. Features Dolby Vision HDR, voice assistant and 120Hz refresh rate.', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800', 'Best Seller', true, 12, 4.8, 124, 'active'),
  ('CarryGo Hisense 65" QLED Ultra Smart TV', 'CGO-TV-65Q', 'CarryGoExpress', 'Televisions', 685000.00, 750000.00, 'Quantum Dot display delivering over a billion vibrant colors. Gaming mode with low latency and cinematic surround sound.', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800', 'Popular', true, 8, 4.9, 89, 'active'),
  ('CarryGo Hisense 43" Full HD Smart TV', 'CGO-TV-43F', 'CarryGoExpress', 'Televisions', 185000.00, 210000.00, 'Crisp Full HD resolution perfect for bedrooms, apartments and office spaces. Built-in WiFi, Netflix and YouTube apps.', 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800', NULL, true, 25, 4.5, 256, 'active'),
  ('CarryGo Hisense 75" Mini-LED Cinematic TV', 'CGO-TV-75M', 'CarryGoExpress', 'Televisions', 1250000.00, 1450000.00, 'Mini-LED backlight with 1000+ local dimming zones. Premium IMAX Enhanced cinematic performance for film lovers.', 'https://images.unsplash.com/photo-1601944179066-29b8f7e13a56?w=800', 'Premium', true, 4, 4.9, 45, 'active'),
  ('CarryGo SoundPulse 2.1 Soundbar with Subwoofer', 'CGO-AUD-SB1', 'CarryGoExpress', 'Audio', 85000.00, 95000.00, '2.1 channel wireless audio with powerful deep bass subwoofer. Dolby Audio, HDMI ARC, optical and Bluetooth connectivity.', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800', 'Hot Deal', true, 15, 4.6, 78, 'active'),
  ('CarryGo Ultra Bass Home Theater System 5.1', 'CGO-AUD-HT5', 'CarryGoExpress', 'Audio', 195000.00, 230000.00, 'True 5.1 surround sound audio with rear satellite speakers and dedicated center channel for clear dialogue.', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800', 'Top Rated', true, 9, 4.7, 52, 'active'),
  ('CarryGo CinemaMax 4K Laser Projector 100"', 'CGO-PRJ-100', 'CarryGoExpress', 'Projectors', 2100000.00, 2400000.00, 'Ultra-short throw 4K laser projection up to 100 inches with ambient light rejection screen compatibility.', 'https://images.unsplash.com/photo-1517604931442-7105376f2611?w=800', 'Flagship', true, 3, 5.0, 18, 'active'),
  ('CarryGo Portable Smart Mini Projector HD', 'CGO-PRJ-MIN', 'CarryGoExpress', 'Projectors', 145000.00, 175000.00, 'Pocket-sized smart projector with built-in battery, auto-keystone correction, Android OS and wireless screen mirroring.', 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800', 'Portable', true, 14, 4.4, 63, 'active'),
  ('CarryGo Pro Wireless Noise-Cancelling Headphones', 'CGO-HPH-NC1', 'CarryGoExpress', 'Headphones', 65000.00, 80000.00, 'Active noise cancellation with 40-hour battery life. Premium memory foam ear cushions and crystal clear call microphones.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'Trending', true, 20, 4.8, 140, 'active'),
  ('CarryGo 27" QHD 165Hz Gaming Monitor', 'CGO-MON-27G', 'CarryGoExpress', 'Monitors', 230000.00, 260000.00, 'Fast IPS display with 1ms response time and 165Hz refresh rate. HDR400, AMD FreeSync Premium and ultra-thin bezels.', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', 'Gaming', true, 11, 4.7, 85, 'active'),
  ('CarryGo Smart Hub IoT Home Controller', 'CGO-SMT-HB1', 'CarryGoExpress', 'Smart Home', 45000.00, 55000.00, 'Central smart home automation bridge with Zigbee, Matter and WiFi compatibility. Automate lights, plugs and security sensors.', 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800', NULL, true, 18, 4.5, 39, 'active'),
  ('CarryGo Hisense 32" HD LED Smart TV', 'CGO-TV-32H', 'CarryGoExpress', 'Televisions', 115000.00, 130000.00, 'Energy-efficient smart television with vivid color booster. Perfect for guest rooms, study areas and kitchens.', 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800', 'Budget Pick', true, 30, 4.4, 210, 'active')
) AS v(name, sku, brand, category, price, original_price, description, image, badge, in_stock, stock, rating, reviews, status)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

-- ============================================================
-- ── 8. CarryGoExpress Admin User Setup & Schema Repair ──
-- Run this block in Supabase SQL Editor to provision your Admin
-- and repair any NULL token scan errors in auth.users.
--
-- Admin Credentials Setup:
-- Email:    admin@carrygoexpress.com
-- Password: Set your own strong password in v_admin_pass below before executing.
-- ============================================================

-- Repair any existing rows in auth.users that have NULL token strings
-- (Prevents GoTrue "500: Database error querying schema" scan errors)
DO $$
BEGIN
  UPDATE auth.users
  SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone = COALESCE(phone, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, '')
  WHERE confirmation_token IS NULL OR recovery_token IS NULL OR email = 'admin@carrygoexpress.com';
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DO $$
DECLARE
  v_admin_id UUID := gen_random_uuid();
  v_admin_email TEXT := 'admin@carrygoexpress.com';
  -- IMPORTANT: Replace with your strong secret password before running in Supabase SQL editor:
  v_admin_pass TEXT := 'REPLACE_WITH_YOUR_STRONG_PASSWORD';
BEGIN
  IF v_admin_pass = 'REPLACE_WITH_YOUR_STRONG_PASSWORD' THEN
    RAISE NOTICE 'Please set v_admin_pass to your desired administrator password before running this provisioning script.';
    RETURN;
  END IF;
  -- 1. Create or update in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_admin_email) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone,
      phone_change,
      phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      v_admin_email,
      crypt(v_admin_pass, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"CarryGo Administrator","role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    );

    INSERT INTO public.profiles (id, full_name, email, role, status)
    VALUES (
      v_admin_id,
      'CarryGo Administrator',
      v_admin_email,
      'admin',
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
  ELSE
    -- If admin already exists in auth.users, ensure confirmed, non-null tokens and admin role
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        phone = COALESCE(phone, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, '')
    WHERE email = v_admin_email;

    UPDATE public.profiles 
    SET role = 'admin', 
        status = 'active'
    WHERE email = v_admin_email;
  END IF;
END $$;

