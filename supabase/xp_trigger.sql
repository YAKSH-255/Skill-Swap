-- 1. Create the function that assigns random XP
CREATE OR REPLACE FUNCTION public.award_session_xp()
RETURNS TRIGGER AS $$
DECLARE
  mentor_xp_gain INT;
  learner_xp_gain INT;
BEGIN
  -- Only trigger when a session is marked as 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Generate random XP between 1 and 100
    mentor_xp_gain := floor(random() * 100 + 1)::INT;
    learner_xp_gain := floor(random() * 100 + 1)::INT;

    -- Update host (Mentor) profile with teacher XP
    UPDATE profiles 
    SET teacher_xp = teacher_xp + mentor_xp_gain
    WHERE id = NEW.host_id;

    -- Update guest (Learner) profile with learner XP
    UPDATE profiles 
    SET learner_xp = learner_xp + learner_xp_gain
    WHERE id = NEW.guest_id;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the sessions table
DROP TRIGGER IF EXISTS on_session_completed ON sessions;
CREATE TRIGGER on_session_completed
  AFTER UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION public.award_session_xp();
