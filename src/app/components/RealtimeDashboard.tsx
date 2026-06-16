import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Repeat2, Users, MessageSquare, Calendar,
  Trophy, Settings, Bell, Search, Flame, Zap, LogOut, Menu, X,
  GraduationCap, ChevronDown, Compass,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useSwaps } from '@/hooks/useSwaps';
import { useLeaderboard } from '@/hooks/useDiscovery';
import { SwapsPanel } from './panels/SwapsPanel';
import { SessionsPanel } from './panels/SessionsPanel';
import { MessagesPanel } from './panels/MessagesPanel';
import { DiscoveryPanel } from './panels/DiscoveryPanel';
import { CommunityPanel } from './panels/CommunityPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { JitsiSessionRoom } from './JitsiSessionRoom';
import { ProfileSetup } from './ProfileSetup';
import { UserProfileModal } from './UserProfileModal';
import type { Session, SwapProposal } from '@/types/database';

const O = {
  bg: '#FDFCF8', fg: '#2C2C24', primary: '#5D7052', primaryFg: '#F3F4F1',
  secondary: '#C18C5D', muted: '#F0EBE5', mutedFg: '#78786C', border: '#DED8CF', card: '#FEFEFA',
};

const shadowSoft = '0 4px 20px -2px rgba(93,112,82,0.15)';
const shadowFloat = '0 10px 40px -10px rgba(193,140,93,0.2)';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
  { icon: Compass, label: 'Discover', key: 'discover' },
  { icon: Repeat2, label: 'Skill Exchange', key: 'swaps' },
  { icon: Calendar, label: 'Sessions', key: 'sessions' },
  { icon: Users, label: 'Community', key: 'community' },
  { icon: MessageSquare, label: 'Messages', key: 'messages' },
  { icon: Trophy, label: 'Leaderboard', key: 'leaderboard' },
  { icon: Settings, label: 'Settings', key: 'settings' },
];

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function getTitle(totalXp: number): { name: string; emoji: string; color: string } {
  if (totalXp >= 100000) return { name: 'Legendary Sage', emoji: '🌟', color: '#D4AF37' };
  if (totalXp >= 50000)  return { name: 'Grand Master', emoji: '🏆', color: '#C0872F' };
  if (totalXp >= 25000)  return { name: 'Archmage', emoji: '🔮', color: '#9B59B6' };
  if (totalXp >= 10000)  return { name: 'Champion', emoji: '⚔️', color: '#E74C3C' };
  if (totalXp >= 5000)   return { name: 'Expert', emoji: '💎', color: '#2980B9' };
  if (totalXp >= 2000)   return { name: 'Adept', emoji: '🌿', color: '#27AE60' };
  if (totalXp >= 1000)   return { name: 'Scholar', emoji: '📚', color: '#5D7052' };
  if (totalXp >= 500)    return { name: 'Apprentice', emoji: '🎓', color: '#C18C5D' };
  if (totalXp >= 100)    return { name: 'Initiate', emoji: '✨', color: '#78786C' };
  return { name: 'Novice', emoji: '🌱', color: '#9BA89A' };
}

export function RealtimeDashboard() {
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.id);
  const { swaps } = useSwaps(user?.id);
  const { leaders } = useLeaderboard();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [prevNav, setPrevNav] = useState('dashboard');
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [scheduleFor, setScheduleFor] = useState<{ swap: SwapProposal; partnerId: string } | null>(null);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);

  const navigateTo = (key: string) => {
    setPrevNav(activeNav);
    setActiveNav(key);
  };

  const pendingSwaps = swaps.filter((s) => s.to_user_id === user?.id && s.status === 'pending').length;
  const displayName = profile?.full_name ?? user?.email ?? 'User';
  const totalXp = (profile?.learner_xp ?? 0) + (profile?.teacher_xp ?? 0);
  const myTitle = getTitle(totalXp);

  const handleScheduleSession = (swap: SwapProposal, partnerId: string) => {
    setScheduleFor({ swap, partnerId });
    navigateTo('sessions');
  };

  // Leaderboard avatar colors
  const leaderAvatarColor = (name: string) => {
    const colors = ['#5D7052', '#C18C5D', '#8B7355', '#7B8FA1', '#A87D6B', '#6B8E6B', '#9B8260', '#7A6E9C'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'discover': return <DiscoveryPanel />;
      case 'swaps': return <SwapsPanel onScheduleSession={handleScheduleSession} />;
      case 'sessions': return (
        <SessionsPanel
          onJoinSession={setActiveSession}
          scheduleFor={scheduleFor}
          onClearSchedule={() => setScheduleFor(null)}
        />
      );
      case 'community': return <CommunityPanel />;
      case 'messages': return <MessagesPanel />;
      case 'settings': return <SettingsPanel />;
      case 'leaderboard': return (
        <div className="space-y-4">
          <div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: O.fg, fontSize: 20 }}>Leaderboard</h3>
            <p style={{ fontSize: 13, color: O.mutedFg }}>Top learners by XP — updates in realtime</p>
          </div>
          <div className="space-y-2">
            {leaders.map((u, i) => (
              <motion.div key={u.id} className="flex items-center gap-3 p-4 rounded-2xl"
                style={{
                  background: u.id === user?.id ? `${O.primary}10` : O.muted,
                  border: `1px solid ${u.id === user?.id ? O.primary + '30' : O.border}`,
                }}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ x: 4 }}
              >
                <span style={{ fontWeight: 800, width: 28, color: i < 3 ? O.secondary : O.mutedFg, fontSize: i < 3 ? 20 : 14 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <button
                  onClick={() => u.id !== user?.id && setViewProfileId(u.id)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white overflow-hidden"
                  style={{ background: leaderAvatarColor(u.full_name ?? ''), fontWeight: 800, border: 'none', cursor: u.id !== user?.id ? 'pointer' : 'default' }}
                >
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : initials(u.full_name)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ fontWeight: u.id === user?.id ? 800 : 600, color: O.fg }}>
                    {u.full_name} {u.id === user?.id && <span style={{ color: O.primary }}>(you)</span>}
                  </p>
                  <p className="text-xs" style={{ color: getTitle(u.learner_xp + u.teacher_xp).color, fontWeight: 700 }}>
                    {getTitle(u.learner_xp + u.teacher_xp).emoji} {getTitle(u.learner_xp + u.teacher_xp).name}
                  </p>
                </div>
                <span style={{ fontSize: 13, color: O.primary, fontWeight: 800 }}>
                  {(u.learner_xp + u.teacher_xp).toLocaleString()} XP
                </span>
              </motion.div>
            ))}
            {leaders.length === 0 && (
              <p className="text-center py-8" style={{ color: O.mutedFg }}>No users on the leaderboard yet.</p>
            )}
          </div>
        </div>
      );
      default: return (
        <div className="space-y-6">
          <motion.div className="relative overflow-hidden p-6 rounded-3xl"
            style={{ background: O.primary, boxShadow: shadowFloat }}
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative z-10">
              <p style={{ color: `${O.primaryFg}cc`, fontSize: 13, fontWeight: 700 }}>Welcome back 👋</p>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 24, color: O.primaryFg, margin: '4px 0' }}>
                {displayName}
              </h1>
              <div className="flex items-center gap-3 flex-wrap mt-1 mb-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: O.primaryFg, border: '1px solid rgba(255,255,255,0.3)' }}>
                  {myTitle.emoji} {myTitle.name}
                </span>
                <span style={{ color: `${O.primaryFg}bb`, fontSize: 13 }}>
                  {totalXp.toLocaleString()} XP
                  {(profile?.streak_days ?? 0) > 0 && ` · ${profile!.streak_days} day streak 🔥`}
                </span>
              </div>
              <div className="flex gap-3 mt-4 flex-wrap">
                <button onClick={() => navigateTo('discover')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm"
                  style={{ background: 'rgba(255,255,255,0.18)', color: O.primaryFg, fontWeight: 800, border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer' }}>
                  <Compass size={14} /> Find Swap Partner
                </button>
                <button onClick={() => navigateTo('sessions')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm"
                  style={{ background: `${O.secondary}50`, border: `1px solid ${O.secondary}70`, color: O.primaryFg, fontWeight: 800, cursor: 'pointer' }}>
                  <Calendar size={14} /> My Sessions
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: 'Learner XP', value: (profile?.learner_xp ?? 0).toLocaleString(), color: O.primary },
              { icon: Flame, label: 'Teacher XP', value: (profile?.teacher_xp ?? 0).toLocaleString(), color: O.secondary },
              { icon: Repeat2, label: 'Active Swaps', value: String(swaps.filter((s) => s.status === 'accepted').length), color: '#8B7355' },
              { icon: Trophy, label: 'Reputation', value: Number(profile?.reputation_score ?? 50).toFixed(1), color: '#B8956A' },
            ].map(({ icon: Icon, label, value, color }) => (
              <motion.div key={label} className="p-5 rounded-2xl" style={{ background: O.card, border: `1px solid ${O.border}`, boxShadow: shadowSoft }}
                whileHover={{ y: -3, boxShadow: shadowFloat }}>
                <Icon size={22} style={{ color, marginBottom: 12 }} />
                <p style={{ fontSize: 24, fontWeight: 800, color: O.fg, fontFamily: "'Fraunces', serif" }}>{value}</p>
                <p style={{ fontSize: 13, color: O.mutedFg, fontWeight: 600 }}>{label}</p>
              </motion.div>
            ))}
          </div>

          <SwapsPanel onScheduleSession={handleScheduleSession} />
        </div>
      );
    }
  };

  return (
    <>
      {!profile?.bio && profile && <ProfileSetup />}

      {viewProfileId && (
        <UserProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}

      {activeSession && (
        <JitsiSessionRoom
          session={activeSession}
          displayName={displayName}
          onClose={() => setActiveSession(null)}
        />
      )}

      <div className="min-h-screen w-full flex" style={{ background: O.bg, color: O.fg, fontFamily: "'Nunito', sans-serif" }}>
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(44,44,36,0.4)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(sidebarOpen || mobileSidebarOpen) && (
            <motion.aside className="fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto flex flex-col"
              style={{ width: 248, background: O.muted, borderRight: `1px solid ${O.border}`, boxShadow: shadowFloat }}
              initial={{ x: -248 }} animate={{ x: 0 }} exit={{ x: -248 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: `1px solid ${O.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: O.primary }}>
                  <GraduationCap size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17 }}>SkillSwap</p>
                  <p style={{ fontSize: 10, color: O.mutedFg, fontWeight: 600 }}>Free forever</p>
                </div>
                <button className="ml-auto lg:hidden" onClick={() => setMobileSidebarOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: O.mutedFg }}>
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {navItems.map(({ icon: Icon, label, key }) => {
                  const isActive = activeNav === key;
                  const badge = key === 'swaps' ? pendingSwaps : key === 'messages' ? undefined : undefined;
                  return (
                  <button key={key} onClick={() => { navigateTo(key); setMobileSidebarOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left relative mb-1"
                      style={{
                        background: isActive ? `${O.primary}18` : 'transparent',
                        color: isActive ? O.primary : O.mutedFg,
                        border: isActive ? `1px solid ${O.primary}30` : '1px solid transparent',
                        borderRadius: '1.25rem', cursor: 'pointer',
                      }}>
                      <Icon size={18} />
                      <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 600 }}>{label}</span>
                      {badge != null && badge > 0 && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                          style={{ background: O.primary, color: '#fff', fontWeight: 700 }}>{badge}</span>
                      )}
                    </button>
                  );
                })}

                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${O.border}` }}>
                  <button onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-2xl"
                    style={{ color: O.mutedFg, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <LogOut size={18} />
                    <span style={{ fontSize: 14 }}>Logout</span>
                  </button>
                </div>
              </nav>

              <div className="m-3 p-4 rounded-3xl" style={{ background: O.card, border: `1px solid ${O.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white overflow-hidden"
                    style={{ background: O.primary, fontWeight: 800 }}>
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials(displayName)}
                  </div>
                  <div>
                    <p className="truncate text-sm font-bold">{displayName}</p>
                    <p className="text-xs" style={{ color: myTitle.color, fontWeight: 700 }}>
                      {myTitle.emoji} {myTitle.name} · {totalXp.toLocaleString()} XP
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 py-3"
            style={{ background: 'rgba(253,252,248,0.82)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${O.border}` }}>
            <button onClick={() => {
              if (window.innerWidth >= 1024) setSidebarOpen((p) => !p);
              else setMobileSidebarOpen((p) => !p);
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: O.mutedFg }}>
              <Menu size={20} />
            </button>

            {activeNav === 'discover' && (
              <div className="relative flex-1 max-w-xs hidden sm:flex">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: O.mutedFg }} />
                <input placeholder="Search skills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 outline-none" style={{ height: 40, background: O.card, border: `1px solid ${O.border}`, borderRadius: 9999, fontSize: 14 }} />
              </div>
            )}

            <div className="ml-auto flex items-center gap-3">
              {(profile?.streak_days ?? 0) > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: `${O.secondary}15`, border: `1px solid ${O.secondary}30` }}>
                  <Flame size={14} style={{ color: O.secondary }} />
                  <span style={{ fontSize: 13, color: O.secondary, fontWeight: 800 }}>{profile!.streak_days} day streak</span>
                </div>
              )}

              <div className="relative">
                <button onClick={() => setNotifOpen((p) => !p)}
                  className="w-10 h-10 rounded-full flex items-center justify-center relative"
                  style={{ background: O.muted, border: `1px solid ${O.border}`, cursor: 'pointer' }}>
                  <Bell size={16} style={{ color: O.mutedFg }} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: O.secondary }} />
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div className="absolute right-0 w-80 p-4 z-50"
                      style={{ background: O.card, border: `1px solid ${O.border}`, borderRadius: '1.5rem', boxShadow: shadowFloat, marginTop: 8 }}
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <div className="flex justify-between items-center mb-3">
                        <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}>Notifications</p>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs" style={{ color: O.primary, background: 'none', border: 'none', cursor: 'pointer' }}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-sm py-4 text-center" style={{ color: O.mutedFg }}>No notifications</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div key={n.id} className="flex gap-3 py-2.5 cursor-pointer"
                            style={{ borderBottom: `1px solid ${O.border}`, opacity: n.read ? 0.6 : 1 }}
                            onClick={() => markRead(n.id)}>
                            <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: n.read ? O.border : O.primary }} />
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</p>
                              <p style={{ fontSize: 11, color: O.mutedFg }}>{n.body}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: O.muted, border: `1px solid ${O.border}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white overflow-hidden"
                  style={{ background: O.primary, fontWeight: 800 }}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials(displayName)}
                </div>
                <span className="hidden sm:block text-sm font-bold">{displayName.split(' ')[0]}</span>
                <ChevronDown size={14} style={{ color: O.mutedFg }} />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}
