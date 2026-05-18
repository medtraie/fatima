-- Fix factory_operations table RLS policies and structure

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS public.factory_operations (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    truck_id TEXT,
    supplier_id TEXT,
    driver_name TEXT,
    bl_reference TEXT,
    sent_bottles JSONB,
    received_bottles JSONB,
    date TIMESTAMPTZ,
    received_date TIMESTAMPTZ,
    debt_change NUMERIC
);

-- Enable RLS
ALTER TABLE public.factory_operations ENABLE ROW LEVEL SECURITY;

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'factory_operations' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.factory_operations ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Enable read access for all users" ON public.factory_operations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.factory_operations;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.factory_operations;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.factory_operations;
DROP POLICY IF EXISTS "Users can view their own factory operations" ON public.factory_operations;
DROP POLICY IF EXISTS "Users can insert their own factory operations" ON public.factory_operations;
DROP POLICY IF EXISTS "Users can update their own factory operations" ON public.factory_operations;
DROP POLICY IF EXISTS "Users can delete their own factory operations" ON public.factory_operations;

-- Create policies for authenticated users to manage their own data
CREATE POLICY "Users can view their own factory operations"
    ON public.factory_operations FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own factory operations"
    ON public.factory_operations FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own factory operations"
    ON public.factory_operations FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own factory operations"
    ON public.factory_operations FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_factory_operations_user_id ON public.factory_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_factory_operations_date ON public.factory_operations(date);