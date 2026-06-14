import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSkills } from '@/hooks/useDiscovery';

const O = {
  fg: '#2C2C24', primary: '#5D7052', muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

export function ProfileSetup() {
  const { user, profile, refreshProfile } = useAuth();
  const { skills } = useSkills();
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [teachSkill, setTeachSkill] = useState('');
  const [learnSkill, setLearnSkill] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (dismissed || (profile?.bio && profile.bio.length > 0)) return null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await supabase.from('profiles').update({ bio }).eq('id', user.id);

    const teach = skills.find((s) => s.id === teachSkill);
    const learn = skills.find((s) => s.id === learnSkill);

    if (teach) {
      await supabase.from('user_skills').upsert({
        user_id: user.id, skill_id: teach.id, skill_type: 'teach', description: `I can teach ${teach.name}`,
      }, { onConflict: 'user_id,skill_id,skill_type' });
    }
    if (learn) {
      await supabase.from('user_skills').upsert({
        user_id: user.id, skill_id: learn.id, skill_type: 'learn', description: `I want to learn ${learn.name}`,
      }, { onConflict: 'user_id,skill_id,skill_type' });
    }

    await refreshProfile();
    setSaving(false);
    setDismissed(true);
  };

  return (
    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: 'rgba(44,44,36,0.5)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="w-full max-w-md p-6 rounded-3xl relative"
        style={{ background: O.card, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
        <button onClick={() => setDismissed(true)} className="absolute top-4 right-4"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: O.mutedFg }}>
          <X size={20} />
        </button>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, marginBottom: 8, color: O.fg }}>Complete Your Profile</h2>
        <p className="text-sm mb-4" style={{ color: O.mutedFg }}>Tell the community what you teach and want to learn.</p>

        <textarea placeholder="Write a short bio..." value={bio} onChange={(e) => setBio(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none mb-3" rows={3}
          style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }} />

        <select value={teachSkill} onChange={(e) => setTeachSkill(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-3"
          style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}>
          <option value="">Skill you can teach...</option>
          {skills.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
        </select>

        <select value={learnSkill} onChange={(e) => setLearnSkill(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-4"
          style={{ border: `1px solid ${O.border}`, background: O.muted, color: O.fg }}>
          <option value="">Skill you want to learn...</option>
          {skills.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
        </select>

        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm"
          style={{ background: O.primary, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </motion.div>
    </motion.div>
  );
}
