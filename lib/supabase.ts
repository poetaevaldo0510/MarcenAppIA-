
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

// No ambiente local, usamos placeholders. No Vercel/Produção, process.env cuidará disso.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * ESQUEMA DE TABELAS RECOMENDADO (SQL):
 * 
 * create table public.users (
 *   id uuid references auth.users not null primary key,
 *   email text,
 *   credits int default 50,
 *   plan text default 'free'
 * );
 * 
 * create table public.projects (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references public.users not null,
 *   title text,
 *   dna_locked jsonb,
 *   status text default 'draft',
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table public.renders (
 *   id uuid default gen_random_uuid() primary key,
 *   project_id uuid references public.projects not null,
 *   version int,
 *   url_faithful text,
 *   url_decorated text,
 *   seed int,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * create table public.credits_log (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references public.users not null,
 *   amount int,
 *   description text,
 *   created_at timestamp with time zone default now()
 * );
 */
