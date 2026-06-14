# Signup Database Error - Debugging Guide

## Step 1: Check Browser Console for Real Error

Open your browser and try signing up again:

1. Press **F12** to open Developer Tools
2. Click **Console** tab
3. Try signing up again
4. Look for errors like:
   - `Profile creation full error:`
   - `permission denied`
   - `row-level security`
   - `new row violates`

**Copy the exact error message** and share it.

---

## Most Likely Issue: RLS (Row Level Security) Policy

The `profiles` table likely has an RLS policy that's blocking the insert.

### Fix 1: Check Current RLS Policy (RECOMMENDED)

**In Supabase Dashboard:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Authentication** → **Policies**
4. Find `profiles` table
5. Look for `INSERT` policy

**What you should see:**
```sql
-- Correct RLS policy allows authenticated users to create their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**If you DON'T see this policy, add it:**

Go to **SQL Editor** → **New Query** → Paste this:

```sql
-- Allow users to create their own profile
CREATE POLICY "Users can create their own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
```

Click **Run**.

---

### Fix 2: Use Stored Function (ADVANCED - Most Reliable)

If RLS is still blocking, use a stored function that bypasses RLS:

1. Go to **SQL Editor** → **New Query**
2. Copy/paste the contents of `supabase/create_profile_function.sql`
3. Click **Run**

Then update your code to use the function instead of direct insert.

---

## Step 2: Verify RLS Policies Exist

Run this query in SQL Editor to see all policies on profiles table:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**You should see policies like:**
- `Users can read their own profile`
- `Users can update their own profile`
- `Users can create their own profile`

If you see **0 results**, RLS is not configured and needs to be set up.

---

## Step 3: Check Profiles Table RLS Status

Run this in SQL Editor:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
```

**Look for:**
- `rowsecurity = true` → RLS is **enabled** (good)
- `rowsecurity = false` → RLS is **disabled** (problem)

### If RLS is Disabled

Enable RLS:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

Then add these policies:

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile  
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);
```

---

## Step 4: Test the Complete Flow

After applying policies, test signup:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try signing up with:
   - **Email:** `test@example.com`
   - **Name:** `Test User`
   - **Password:** `Test123!`

### Success Indicators

You should see console logs like:
```
Auth user created: 12345abc...
Attempting to create profile with data: {id: "12345abc", ...}
Profile created successfully: [...]
```

### If Still Failing

You should see better error details now:
```
Profile creation full error: {
  message: "permission denied for schema public",
  code: "42501",
  details: "..."
}
```

---

## Complete RLS Setup (Copy & Paste)

If you need to set up RLS from scratch:

**Go to SQL Editor and run this:**

```sql
-- 1. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to create their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 4. Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- 5. Allow users to see other profiles (public profiles)
CREATE POLICY "Users can read other profiles" ON public.profiles
FOR SELECT TO authenticated
USING (true);
```

---

## Troubleshooting Checklist

- [ ] Opened browser console (F12)
- [ ] Attempted signup and got error
- [ ] Copied exact error message
- [ ] Checked RLS policies exist on profiles table
- [ ] Verified `rowsecurity = true` 
- [ ] Confirmed `auth.uid() = id` policy exists
- [ ] Ran the SQL to enable RLS and add policies
- [ ] Tested signup again

---

## Quick Diagnosis Commands

Run these in SQL Editor to diagnose:

**Check RLS status:**
```sql
SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';
```

**Check all policies:**
```sql
SELECT policyname, permissive, roles FROM pg_policies WHERE tablename = 'profiles';
```

**Check if profiles table has any records:**
```sql
SELECT COUNT(*) as profile_count FROM public.profiles;
```

**Check latest auth user:**
```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 1;
```

---

## If You're Still Stuck

1. **Share the console error** - Open F12 → Console and paste the error
2. **Run the diagnosis query** above and share results
3. **Check that RLS policies were applied** - Run the policy check query

The most common issue is **missing INSERT RLS policy**, which we've covered above.

---

## Files Referenced

- `supabase/create_profile_function.sql` - Alternative function-based approach
- `supabase/auth_trigger.sql` - Auto-create trigger approach
- `src/contexts/AuthContext.tsx` - Updated with better logging

---

## What's Happening Behind the Scenes

```
User Signup Form
       ↓
AuthContext.signUp()
       ↓
Supabase creates auth.user ✅
       ↓
Try to insert into profiles table
       ↓
RLS Policy Check ← LIKELY FAILURE HERE
       ↓
If policy allows → Profile created ✅
If policy blocks → "permission denied" error ❌
```

Your task: **Make sure the RLS policy allows the INSERT**

---

## Next Steps

1. **Check console error** - What exactly does it say?
2. **Run RLS policy check query** above
3. **Add the INSERT policy** if missing
4. **Test signup again**

Let me know what error you see in the console! 🔍
