-- QUICK FIX: Run this if signup is failing with "Database error"
-- This sets up proper RLS policies on the profiles table
-- Go to Supabase Dashboard → SQL Editor → New Query → Paste all of this → Run

-- Step 1: Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Create INSERT policy (allows creating own profile)
CREATE POLICY "allow_user_insert_own_profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Step 3: Create SELECT policy (allows reading own profile)
CREATE POLICY "allow_user_read_own_profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Step 4: Create SELECT policy for other profiles (for discovery)
CREATE POLICY "allow_read_all_profiles" ON public.profiles
FOR SELECT TO authenticated
USING (true);

-- Step 5: Create UPDATE policy (allows updating own profile)
CREATE POLICY "allow_user_update_own_profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify policies were created
SELECT policyname, permissive, roles FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
