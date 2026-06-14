-- Stored function to create profile (bypasses RLS)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    timezone,
    reputation_score,
    learner_xp,
    teacher_xp,
    streak_days,
    verified_mentor
  ) VALUES (
    p_user_id,
    p_email,
    COALESCE(p_full_name, 'User'),
    'UTC',
    50.00,
    0,
    0,
    0,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN QUERY SELECT true, 'Profile created successfully'::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;
