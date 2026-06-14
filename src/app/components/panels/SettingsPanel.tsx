import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Plus, Trash2, User, Clock, FileText, Zap, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSkills } from '@/hooks/useDiscovery';
import type { UserSkill } from '@/types/database';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

export function SettingsPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const { skills } = useSkills();
  
  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Skills state
  const [userSkills, setUserSkills] = useState<(UserSkill & { skills?: { name: string; category: string } })[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  
  const [teachSkill, setTeachSkill] = useState('');
  const [learnSkill, setLearnSkill] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
      setBio(profile.bio ?? '');
      setTimezone(profile.timezone ?? 'UTC');
    }
  }, [profile]);

  const fetchUserSkills = async () => {
    if (!user) return;
    setLoadingSkills(true);
    const { data, error } = await supabase
      .from('user_skills')
      .select('*, skills(name, category)')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setUserSkills(data as any);
    }
    setLoadingSkills(false);
  };

  useEffect(() => {
    fetchUserSkills();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    setProfileMessage('');
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, avatar_url: avatarUrl, bio, timezone })
      .eq('id', user.id);
      
    if (!error) {
      await refreshProfile();
      setProfileMessage('Profile updated successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } else {
      setProfileMessage('Error updating profile.');
    }
    setSavingProfile(false);
  };

  const handleAddSkill = async (skillId: string, skillType: 'teach' | 'learn') => {
    if (!user || !skillId) return;
    
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;

    const description = skillType === 'teach' ? `I can teach ${skill.name}` : `I want to learn ${skill.name}`;
    
    await supabase.from('user_skills').upsert({
      user_id: user.id, 
      skill_id: skill.id, 
      skill_type: skillType, 
      description,
    }, { onConflict: 'user_id,skill_id,skill_type' });
    
    if (skillType === 'teach') setTeachSkill('');
    else setLearnSkill('');
    
    fetchUserSkills();
  };

  const handleRemoveSkill = async (userSkillId: string) => {
    await supabase.from('user_skills').delete().eq('id', userSkillId);
    fetchUserSkills();
  };

  const teachSkillsList = userSkills.filter(s => s.skill_type === 'teach');
  const learnSkillsList = userSkills.filter(s => s.skill_type === 'learn');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 24 }}>Settings</h3>
        <p style={{ fontSize: 14, color: O.mutedFg }}>Manage your profile and skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Section */}
        <motion.div className="p-6 rounded-3xl space-y-4"
          style={{ background: O.card, border: `1px solid ${O.border}` }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h4 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 18 }}>Personal Info</h4>
          
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-1" style={{ color: O.mutedFg }}>
                <User size={14} /> Full Name
              </label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }} />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-1" style={{ color: O.mutedFg }}>
                <FileText size={14} /> Avatar URL
              </label>
              <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.png"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }} />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-1" style={{ color: O.mutedFg }}>
                <FileText size={14} /> Bio
              </label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }} />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-1" style={{ color: O.mutedFg }}>
                <Clock size={14} /> Timezone
              </label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Paris">Central European Time (CET)</option>
                <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleSaveProfile} disabled={savingProfile}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm"
              style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: savingProfile ? 0.7 : 1 }}>
              <Save size={16} /> {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
            {profileMessage && (
              <p className="text-xs text-center mt-2 font-semibold" style={{ color: O.primary }}>{profileMessage}</p>
            )}
          </div>
        </motion.div>

        {/* Skills Section */}
        <div className="space-y-6">
          <motion.div className="p-6 rounded-3xl space-y-4"
            style={{ background: O.card, border: `1px solid ${O.border}` }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
            <h4 className="flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 18 }}>
              <Zap size={18} style={{ color: O.primary }} /> Skills You Teach
            </h4>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {teachSkillsList.map(us => (
                <div key={us.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: `${O.primary}15`, color: O.primary, border: `1px solid ${O.primary}30`, fontWeight: 700 }}>
                  {us.skills?.name}
                  <button onClick={() => handleRemoveSkill(us.id)} className="ml-1 hover:opacity-70"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: O.primary }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {teachSkillsList.length === 0 && !loadingSkills && (
                <p className="text-xs italic" style={{ color: O.mutedFg }}>No teaching skills added yet.</p>
              )}
            </div>

            <div className="flex gap-2">
              <select value={teachSkill} onChange={(e) => setTeachSkill(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}>
                <option value="">Add a skill to teach...</option>
                {skills.filter(s => !teachSkillsList.some(ts => ts.skill_id === s.id)).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
              <button onClick={() => handleAddSkill(teachSkill, 'teach')} disabled={!teachSkill}
                className="px-3 py-2 rounded-xl text-white flex items-center justify-center"
                style={{ background: O.primary, border: 'none', cursor: 'pointer', opacity: teachSkill ? 1 : 0.5 }}>
                <Plus size={16} />
              </button>
            </div>
          </motion.div>

          <motion.div className="p-6 rounded-3xl space-y-4"
            style={{ background: O.card, border: `1px solid ${O.border}` }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
            <h4 className="flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 18 }}>
              <Star size={18} style={{ color: O.secondary }} /> Skills You Learn
            </h4>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {learnSkillsList.map(us => (
                <div key={us.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                  style={{ background: `${O.secondary}15`, color: O.secondary, border: `1px solid ${O.secondary}30`, fontWeight: 700 }}>
                  {us.skills?.name}
                  <button onClick={() => handleRemoveSkill(us.id)} className="ml-1 hover:opacity-70"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: O.secondary }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {learnSkillsList.length === 0 && !loadingSkills && (
                <p className="text-xs italic" style={{ color: O.mutedFg }}>No learning skills added yet.</p>
              )}
            </div>

            <div className="flex gap-2">
              <select value={learnSkill} onChange={(e) => setLearnSkill(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}>
                <option value="">Add a skill to learn...</option>
                {skills.filter(s => !learnSkillsList.some(ls => ls.skill_id === s.id)).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
              <button onClick={() => handleAddSkill(learnSkill, 'learn')} disabled={!learnSkill}
                className="px-3 py-2 rounded-xl text-white flex items-center justify-center"
                style={{ background: O.secondary, border: 'none', cursor: 'pointer', opacity: learnSkill ? 1 : 0.5 }}>
                <Plus size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
