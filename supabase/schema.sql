-- SkillSwap Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mlbgjzibaakelmmmtagw/sql

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  timezone TEXT DEFAULT 'UTC',
  reputation_score NUMERIC(5,2) DEFAULT 50.00,
  learner_xp INTEGER DEFAULT 0,
  teacher_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  verified_mentor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills catalog
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User teaching/learning skills
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('teach', 'learn')),
  description TEXT DEFAULT '',
  level TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id, skill_type)
);

-- Swap proposals
CREATE TABLE IF NOT EXISTS swap_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_skill TEXT NOT NULL,
  want_skill TEXT NOT NULL,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled / live sessions (Jitsi rooms)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES swap_proposals(id) ON DELETE SET NULL,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  jitsi_room TEXT UNIQUE NOT NULL,
  session_type TEXT DEFAULT 'live_one_on_one',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swap_id UUID REFERENCES swap_proposals(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community rooms
CREATE TABLE IF NOT EXISTS community_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room membership
CREATE TABLE IF NOT EXISTS room_members (
  room_id UUID NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Room chat messages
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  skill_endorsements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, reviewer_id)
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update member count on room join/leave
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_rooms SET member_count = member_count + 1 WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_rooms SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.room_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS room_member_count_trigger ON room_members;
CREATE TRIGGER room_member_count_trigger
  AFTER INSERT OR DELETE ON room_members
  FOR EACH ROW EXECUTE FUNCTION update_room_member_count();

-- Notify on new swap proposal
CREATE OR REPLACE FUNCTION notify_swap_proposal()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type, link)
  VALUES (
    NEW.to_user_id,
    'New Swap Proposal',
    'Someone wants to swap skills with you!',
    'swap',
    '/dashboard?tab=swaps'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_swap_proposal ON swap_proposals;
CREATE TRIGGER on_swap_proposal
  AFTER INSERT ON swap_proposals
  FOR EACH ROW EXECUTE FUNCTION notify_swap_proposal();

-- Seed skill categories
INSERT INTO skills (name, category) VALUES
  ('Python', 'Technology'),
  ('JavaScript', 'Technology'),
  ('React', 'Technology'),
  ('Machine Learning', 'Technology'),
  ('SQL', 'Technology'),
  ('Figma', 'Arts and Creative Skills'),
  ('UI/UX Design', 'Arts and Creative Skills'),
  ('Spanish', 'Languages'),
  ('French', 'Languages'),
  ('Japanese', 'Languages'),
  ('English', 'Languages'),
  ('Public Speaking', 'Life Skills'),
  ('Financial Literacy', 'Business and Finance'),
  ('Guitar', 'Music and Performance'),
  ('Photography', 'Arts and Creative Skills'),
  ('Data Analysis', 'Technology'),
  ('Video Editing', 'Arts and Creative Skills'),
  ('Cooking', 'Wellness and Lifestyle'),
  ('Yoga', 'Wellness and Lifestyle'),
  ('Mathematics', 'Academic Subjects')
ON CONFLICT (name) DO NOTHING;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Skills policies
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);

-- User skills policies
CREATE POLICY "User skills viewable by everyone" ON user_skills FOR SELECT USING (true);
CREATE POLICY "Users manage own skills" ON user_skills FOR ALL USING (auth.uid() = user_id);

-- Swap proposals policies
CREATE POLICY "Users see own swaps" ON swap_proposals FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users create swaps" ON swap_proposals FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Participants update swaps" ON swap_proposals FOR UPDATE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Sessions policies
CREATE POLICY "Participants see sessions" ON sessions FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = guest_id);
CREATE POLICY "Participants create sessions" ON sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id OR auth.uid() = guest_id);
CREATE POLICY "Participants update sessions" ON sessions FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Messages policies
CREATE POLICY "Users see own messages" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers mark read" ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Notifications policies
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Community rooms policies
CREATE POLICY "Rooms viewable by everyone" ON community_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users create rooms" ON community_rooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Room members policies
CREATE POLICY "Room members viewable" ON room_members FOR SELECT USING (true);
CREATE POLICY "Users join rooms" ON room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave rooms" ON room_members FOR DELETE USING (auth.uid() = user_id);

-- Room messages policies
CREATE POLICY "Room messages viewable by members" ON room_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = room_messages.room_id
        AND room_members.user_id = auth.uid()
    )
  );
CREATE POLICY "Members post messages" ON room_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = room_messages.room_id
        AND room_members.user_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Participants write reviews" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE swap_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE community_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE user_skills;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- Session XP Assignment Trigger
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

DROP TRIGGER IF EXISTS on_session_completed ON sessions;
CREATE TRIGGER on_session_completed
  AFTER UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION public.award_session_xp();
