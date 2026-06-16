import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Save, Plus, Trash2, User, Clock, FileText, Zap, Star, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSkills } from '@/hooks/useDiscovery';
import type { UserSkill } from '@/types/database';
import { toast } from 'sonner';

const O = {
  fg: '#2C2C24', primary: '#5D7052', secondary: '#C18C5D',
  muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Sao_Paulo', label: 'Brazil Time (BRT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Moscow', label: 'Moscow Time (MSK)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

export function SettingsPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const { skills } = useSkills();

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Skills state
  const [userSkills, setUserSkills] = useState<(UserSkill & { skills?: { name: string; category: string } })[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [teachSkill, setTeachSkill] = useState('');
  const [learnSkill, setLearnSkill] = useState('');

  // Sync profile changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
      setBio(profile.bio ?? '');
      setTimezone(profile.timezone ?? 'UTC');
    }
  }, [profile]);

  // Fixed: stable fetchUserSkills that doesn't re-create on every render
  const fetchUserSkills = useCallback(async () => {
    if (!user?.id) return;
    setLoadingSkills(true);
    const { data, error } = await supabase
      .from('user_skills')
      .select('*, skills(name, category)')
      .eq('user_id', user.id);
    if (!error && data) setUserSkills(data as (UserSkill & { skills?: { name: string; category: string } })[]);
    setLoadingSkills(false);
  }, [user?.id]);

  useEffect(() => {
    fetchUserSkills();
  }, [fetchUserSkills]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, avatar_url: avatarUrl, bio, timezone })
      .eq('id', user.id);

    if (!error) {
      await refreshProfile();
      toast.success('Profile updated successfully! ✅');
    } else {
      toast.error('Error updating profile. Please try again.');
    }
    setSavingProfile(false);
  };

  const handleAddSkill = async (skillId: string, skillType: 'teach' | 'learn') => {
    if (!user || !skillId) return;
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;

    const { error } = await supabase.from('user_skills').upsert({
      user_id: user.id,
      skill_id: skill.id,
      skill_type: skillType,
      description: skillType === 'teach' ? `I can teach ${skill.name}` : `I want to learn ${skill.name}`,
    }, { onConflict: 'user_id,skill_id,skill_type' });

    if (!error) {
      toast.success(`Added ${skill.name} to your ${skillType} list!`);
      if (skillType === 'teach') setTeachSkill('');
      else setLearnSkill('');
      fetchUserSkills();
    } else {
      toast.error('Failed to add skill.');
    }
  };

  const handleRemoveSkill = async (userSkillId: string, skillName: string) => {
    const { error } = await supabase.from('user_skills').delete().eq('id', userSkillId);
    if (!error) {
      toast.success(`Removed ${skillName}.`);
      fetchUserSkills();
    }
  };

  const teachSkillsList = userSkills.filter((s) => s.skill_type === 'teach');
  const learnSkillsList = userSkills.filter((s) => s.skill_type === 'learn');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 22 }}>Settings</h3>
        <p style={{ fontSize: 14, color: O.mutedFg }}>Manage your profile, avatar, and skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Profile Section ── */}
        <motion.div
          className="p-6 rounded-3xl space-y-4"
          style={{ background: O.card, border: `1px solid ${O.border}` }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <h4 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 17 }}>Personal Info</h4>

          {/* Avatar Preview */}
          <div className="flex items-center gap-4 p-3 rounded-2xl" style={{ background: O.muted }}>
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white font-black shrink-0"
              style={{ background: O.primary, fontSize: 20 }}
            >
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                  onLoad={() => setAvatarError(false)}
                />
              ) : (
                (fullName || 'U').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold mb-1.5" style={{ color: O.mutedFg }}>
                <Eye size={11} className="inline mr-1" /> AVATAR PREVIEW
              </p>
              <input
                value={avatarUrl}
                onChange={(e) => { setAvatarUrl(e.target.value); setAvatarError(false); }}
                placeholder="Paste image URL..."
                className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ border: `1px solid ${avatarError ? '#A85448' : O.border}`, background: O.card, color: O.fg }}
              />
              {avatarError && (
                <p className="text-xs mt-1" style={{ color: '#A85448' }}>⚠ Image failed to load</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-1.5" style={{ color: O.mutedFg }}>
                <User size={12} /> FULL NAME
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-1.5" style={{ color: O.mutedFg }}>
                <FileText size={12} /> BIO
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell the community about yourself..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg, lineHeight: 1.6 }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold mb-1.5" style={{ color: O.mutedFg }}>
                <Clock size={12} /> TIMEZONE
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm"
            style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: savingProfile ? 0.7 : 1 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile'}
          </motion.button>
        </motion.div>

        {/* ── Skills Section ── */}
        <div className="space-y-5">
          {/* Teach Skills */}
          <motion.div
            className="p-6 rounded-3xl space-y-4"
            style={{ background: O.card, border: `1px solid ${O.border}` }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}
          >
            <h4 className="flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 17 }}>
              <Zap size={17} style={{ color: O.primary }} /> Skills You Teach
            </h4>

            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {loadingSkills ? (
                <div className="w-full h-8 rounded-full animate-pulse" style={{ background: O.muted }} />
              ) : teachSkillsList.length === 0 ? (
                <p className="text-xs italic" style={{ color: O.mutedFg }}>No teaching skills added yet.</p>
              ) : (
                teachSkillsList.map((us) => (
                  <motion.div
                    key={us.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                    style={{ background: `${O.primary}15`, color: O.primary, border: `1px solid ${O.primary}28`, fontWeight: 700 }}
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  >
                    {us.skills?.name}
                    <button
                      onClick={() => handleRemoveSkill(us.id, us.skills?.name ?? '')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: O.primary, padding: 0, lineHeight: 1 }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={teachSkill}
                onChange={(e) => setTeachSkill(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}
              >
                <option value="">Add a skill to teach...</option>
                {skills
                  .filter((s) => !teachSkillsList.some((ts) => ts.skill_id === s.id))
                  .map((s) => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)
                }
              </select>
              <motion.button
                onClick={() => handleAddSkill(teachSkill, 'teach')}
                disabled={!teachSkill}
                className="px-3 py-2 rounded-xl text-white flex items-center justify-center"
                style={{ background: O.primary, border: 'none', cursor: 'pointer', opacity: teachSkill ? 1 : 0.45 }}
                whileHover={{ scale: teachSkill ? 1.08 : 1 }} whileTap={{ scale: 0.92 }}
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </motion.div>

          {/* Learn Skills */}
          <motion.div
            className="p-6 rounded-3xl space-y-4"
            style={{ background: O.card, border: `1px solid ${O.border}` }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.16 } }}
          >
            <h4 className="flex items-center gap-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 17 }}>
              <Star size={17} style={{ color: O.secondary }} /> Skills You Learn
            </h4>

            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {loadingSkills ? (
                <div className="w-full h-8 rounded-full animate-pulse" style={{ background: O.muted }} />
              ) : learnSkillsList.length === 0 ? (
                <p className="text-xs italic" style={{ color: O.mutedFg }}>No learning skills added yet.</p>
              ) : (
                learnSkillsList.map((us) => (
                  <motion.div
                    key={us.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                    style={{ background: `${O.secondary}15`, color: O.secondary, border: `1px solid ${O.secondary}28`, fontWeight: 700 }}
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  >
                    {us.skills?.name}
                    <button
                      onClick={() => handleRemoveSkill(us.id, us.skills?.name ?? '')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: O.secondary, padding: 0, lineHeight: 1 }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={learnSkill}
                onChange={(e) => setLearnSkill(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}
              >
                <option value="">Add a skill to learn...</option>
                {skills
                  .filter((s) => !learnSkillsList.some((ls) => ls.skill_id === s.id))
                  .map((s) => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)
                }
              </select>
              <motion.button
                onClick={() => handleAddSkill(learnSkill, 'learn')}
                disabled={!learnSkill}
                className="px-3 py-2 rounded-xl text-white flex items-center justify-center"
                style={{ background: O.secondary, border: 'none', cursor: 'pointer', opacity: learnSkill ? 1 : 0.45 }}
                whileHover={{ scale: learnSkill ? 1.08 : 1 }} whileTap={{ scale: 0.92 }}
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
