export type SwapStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type SkillType = 'teach' | 'learn';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  timezone: string;
  reputation_score: number;
  learner_xp: number;
  teacher_xp: number;
  streak_days: number;
  verified_mentor: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  skill_type: SkillType;
  description: string;
  level: SkillLevel;
  created_at: string;
  skills?: Skill;
}

export interface SwapProposal {
  id: string;
  from_user_id: string;
  to_user_id: string;
  offer_skill: string;
  want_skill: string;
  message: string;
  status: SwapStatus;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Session {
  id: string;
  swap_id: string | null;
  host_id: string;
  guest_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  jitsi_room: string;
  session_type: string;
  created_at: string;
  host_profile?: Profile;
  guest_profile?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  swap_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface CommunityRoom {
  id: string;
  name: string;
  description: string;
  category: string;
  creator_id: string;
  member_count: number;
  created_at: string;
  creator_profile?: Profile;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Review {
  id: string;
  session_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  skill_endorsements: string[];
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      skills: { Row: Skill; Insert: Partial<Skill>; Update: Partial<Skill> };
      user_skills: { Row: UserSkill; Insert: Partial<UserSkill>; Update: Partial<UserSkill> };
      swap_proposals: { Row: SwapProposal; Insert: Partial<SwapProposal>; Update: Partial<SwapProposal> };
      sessions: { Row: Session; Insert: Partial<Session>; Update: Partial<Session> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      community_rooms: { Row: CommunityRoom; Insert: Partial<CommunityRoom>; Update: Partial<CommunityRoom> };
      room_messages: { Row: RoomMessage; Insert: Partial<RoomMessage>; Update: Partial<RoomMessage> };
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> };
    };
  };
}
