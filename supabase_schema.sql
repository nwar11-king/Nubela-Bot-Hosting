-- SQL Schema for Nebula Hosting Panel (Supabase / PostgreSQL)

-- 1. Users Table (handled by Supabase Auth, but we can extend profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Nodes Table
CREATE TABLE IF NOT EXISTS public.nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'installing')),
    cpu_cores INTEGER DEFAULT 1,
    ram_total BIGINT DEFAULT 1024, -- in MB
    disk_usage TEXT DEFAULT '0/0GB',
    api_key TEXT UNIQUE,
    region TEXT DEFAULT 'Global',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Servers / Bot Instances Table
CREATE TABLE IF NOT EXISTS public.servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE,
    node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'starting', 'error')),
    docker_image TEXT DEFAULT 'node:18-alpine',
    cpu_usage INTEGER DEFAULT 0,
    memory_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Settings Table (Singular global record)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    panel_name TEXT DEFAULT 'Nebula Control Panel',
    logo_url TEXT,
    primary_color TEXT DEFAULT '#2563eb',
    allow_signups BOOLEAN DEFAULT TRUE,
    footer_text TEXT DEFAULT 'Secure Handshake Required • Edge-Authenticated SSL',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Settings Data
INSERT INTO public.settings (id, panel_name, primary_color) 
VALUES ('global', 'Nebula Control Panel', '#2563eb')
ON CONFLICT (id) DO NOTHING;

-- RLS RULES (Row Level Security)

-- Enable RLS
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Rules
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 2. Settings Rules (Public Read, Admin Write)
CREATE POLICY "Public read access to settings" ON public.settings FOR SELECT USING (true);
-- Note: Admin check would usually join with profiles.role == 'admin'

-- 3. Nodes Rules (Signed in users can see nodes for status)
CREATE POLICY "Authenticated users can see nodes" ON public.nodes FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Servers Rules (Users see only their own instances)
CREATE POLICY "Users view own servers" ON public.servers FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users create own servers" ON public.servers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users update own servers" ON public.servers FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users delete own servers" ON public.servers FOR DELETE USING (auth.uid() = owner_id);
