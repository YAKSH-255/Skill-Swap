import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, BookOpen, Repeat2, Users, MessageSquare,
  Calendar, Trophy, Settings, Bell, Search, ChevronRight,
  Flame, Zap, Star, TrendingUp, Clock, GraduationCap,
  Lightbulb, ArrowUpRight, Play, CheckCircle2, XCircle,
  LogOut, Menu, X, ChevronDown, Target, Leaf,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ImageWithFallback } from './figma/ImageWithFallback';

// ── Organic / Natural Design Tokens ──────────────────────────────────────────
const O = {
  bg:        '#FDFCF8',   // rice paper
  fg:        '#2C2C24',   // deep loam
  primary:   '#5D7052',   // moss green
  primaryFg: '#F3F4F1',   // pale mist
  secondary: '#C18C5D',   // terracotta
  accent:    '#E6DCCD',   // sand
  accentFg:  '#4A4A40',   // bark
  muted:     '#F0EBE5',   // stone
  mutedFg:   '#78786C',   // dried grass
  border:    '#DED8CF',   // raw timber
  card:      '#FEFEFA',   // cream white
};

const shadowSoft  = '0 4px 20px -2px rgba(93,112,82,0.15)';
const shadowFloat = '0 10px 40px -10px rgba(193,140,93,0.2)';
const shadowHover = '0 20px 40px -10px rgba(93,112,82,0.18)';

const fontBody    = "'Nunito', sans-serif";
const fontHeading = "'Fraunces', serif";

// Grain texture overlay
const grainStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundSize: '128px 128px',
  opacity: 0.03,
  mixBlendMode: 'multiply',
};

// Asymmetric organic card radii
const blobRadii = [
  '2rem',
  '2.5rem 1.5rem 2.5rem 1.5rem',
  '1.5rem 2.5rem 1.5rem 2.5rem',
  '2rem 1rem 2rem 1rem',
  '1rem 2rem 1rem 2rem',
  '2rem 2rem 1rem 2rem',
];

// ── Mock Data ─────────────────────────────────────────────────────────────────
const weeklyActivity = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 4 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 5 },
  { day: 'Fri', hours: 3 },
  { day: 'Sat', hours: 6 },
  { day: 'Sun', hours: 2 },
];

const skillProgress = [
  { name: 'Python', value: 82, fill: O.primary,   id: 'sp-py' },
  { name: 'Design', value: 67, fill: O.secondary, id: 'sp-de' },
  { name: 'ML',     value: 54, fill: '#8B7355',   id: 'sp-ml' },
];

const courses = [
  {
    id: 1, title: 'Advanced Python & ML', instructor: 'Dr. Sarah Kim',
    progress: 72, lessons: 24, done: 17, tag: 'Programming', tagColor: O.primary,
    img: 'https://images.unsplash.com/photo-1733412505442-36cfa59a4240?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGRhcmslMjBzY3JlZW58ZW58MXx8fHwxNzc0OTI0MTM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 2, title: 'Data Science Fundamentals', instructor: 'Prof. James Lee',
    progress: 45, lessons: 18, done: 8, tag: 'Data', tagColor: O.secondary,
    img: 'https://images.unsplash.com/photo-1762279389083-abf71f22d338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwc2NpZW5jZSUyMG1hY2hpbmUlMjBsZWFybmluZyUyMGFic3RyYWN0fGVufDF8fHx8MTc3NDkyNDEzN3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 3, title: 'UI/UX & Creative Design', instructor: 'Maria Chen',
    progress: 89, lessons: 20, done: 18, tag: 'Design', tagColor: '#8B7355',
    img: 'https://images.unsplash.com/photo-1512645592367-97ba8a9d4035?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwY3JlYXRpdmUlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzc0ODk3MDc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

type SwapStatus = 'pending' | 'accepted' | 'declined';
interface SwapRequest {
  id: number; name: string; avatar: string; color: string;
  offer: string; want: string; status: SwapStatus; level: string;
}

const initialSwapRequests: SwapRequest[] = [
  { id: 1, name: 'Alex Turner',   avatar: 'AT', color: O.primary,   offer: 'React.js',        want: 'Figma Design',  status: 'pending',  level: 'Intermediate' },
  { id: 2, name: 'Priya Sharma',  avatar: 'PS', color: O.secondary, offer: 'Machine Learning', want: 'Python',        status: 'pending',  level: 'Advanced' },
  { id: 3, name: 'Carlos Mendez', avatar: 'CM', color: '#8B7355',   offer: 'Spanish',          want: 'Data Analysis', status: 'accepted', level: 'Beginner' },
  { id: 4, name: 'Luna Park',     avatar: 'LP', color: '#7A8C6E',   offer: 'Illustration',     want: 'Video Editing', status: 'pending',  level: 'Intermediate' },
];

const leaderboard = [
  { rank: 1, name: 'Sophia R.', xp: 9840, avatar: 'SR', color: O.secondary },
  { rank: 2, name: 'Marcus D.', xp: 8720, avatar: 'MD', color: O.primary },
  { rank: 3, name: 'You',       xp: 7650, avatar: 'AJ', color: '#8B7355', isUser: true },
  { rank: 4, name: 'Aiko T.',   xp: 7100, avatar: 'AT', color: '#7A8C6E' },
  { rank: 5, name: 'Ryan C.',   xp: 6490, avatar: 'RC', color: '#B8956A' },
];

const upcomingSessions = [
  { time: '10:00 AM', title: 'Python Debug Session', with: 'Alex Turner',   type: 'Swap',      color: O.primary   },
  { time: '2:00 PM',  title: 'ML Concepts Review',   with: 'Dr. Sarah Kim', type: 'Class',     color: O.secondary },
  { time: '5:30 PM',  title: 'Design Feedback',       with: 'Maria Chen',   type: 'Mentoring', color: '#8B7355'   },
];

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: BookOpen,         label: 'My Courses' },
  { icon: Repeat2,          label: 'Skill Exchange', badge: 4 },
  { icon: Users,            label: 'Community' },
  { icon: MessageSquare,    label: 'Messages', badge: 7 },
  { icon: Calendar,         label: 'Calendar' },
  { icon: Trophy,           label: 'Achievements' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, delay, radiusIdx }: {
  icon: React.ElementType; label: string; value: string;
  sub: string; color: string; delay: number; radiusIdx: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden cursor-default group p-5"
      style={{
        background: O.card,
        border: `1px solid ${O.border}80`,
        borderRadius: blobRadii[radiusIdx % blobRadii.length],
        boxShadow: shadowSoft,
      }}
      whileHover={{ y: -4, boxShadow: shadowHover, transition: { duration: 0.25 } }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 10% 10%, ${color}12 0%, transparent 70%)` }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{ background: `${color}14`, border: `1px solid ${color}30` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <div
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
          style={{ background: `${color}14`, color, fontWeight: 700 }}
        >
          <ArrowUpRight size={12} />
          <span>+12%</span>
        </div>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: O.fg, fontFamily: fontHeading, lineHeight: 1.1, marginBottom: 4 }}>
        {value}
      </p>
      <p style={{ fontSize: 13, color: O.fg, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 12, color: O.mutedFg, marginTop: 2 }}>{sub}</p>
    </motion.div>
  );
}

function CourseCard({ course, delay }: { course: typeof courses[0]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex gap-4 p-4 group cursor-pointer"
      style={{
        background: O.muted,
        border: `1px solid ${O.border}60`,
        borderRadius: '1.5rem',
        boxShadow: shadowSoft,
      }}
      whileHover={{ x: 4, boxShadow: shadowHover, transition: { duration: 0.2 } }}
    >
      <div className="relative w-16 h-16 shrink-0 overflow-hidden" style={{ borderRadius: '1rem' }}>
        <ImageWithFallback src={course.img} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'rgba(44,44,36,0.35)' }} />
        <motion.div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
          transition={{ duration: 0.2 }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: O.primary }}
          >
            <Play size={12} color="#fff" style={{ marginLeft: 2 }} />
          </div>
        </motion.div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm truncate" style={{ fontWeight: 700, color: O.fg, fontFamily: fontHeading }}>
            {course.title}
          </p>
          <span
            className="text-xs px-2.5 py-0.5 rounded-full shrink-0"
            style={{ background: `${course.tagColor}18`, color: course.tagColor, fontWeight: 700, border: `1px solid ${course.tagColor}25` }}
          >
            {course.tag}
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: O.mutedFg }}>{course.instructor}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: O.mutedFg }}>{course.done}/{course.lessons} lessons</span>
            <span className="text-xs" style={{ color: course.tagColor, fontWeight: 800 }}>{course.progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: `${O.border}` }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${course.tagColor}, ${O.secondary})` }}
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CircularProgress({ value, fill, size = 60, strokeWidth = 6 }: {
  value: number; fill: string; size?: number; strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={O.border} strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={fill} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [notifOpen, setNotifOpen] = useState(false);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(initialSwapRequests);
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = swapRequests.filter((r) => r.status === 'pending').length;

  function handleSwap(id: number, action: 'accepted' | 'declined') {
    setSwapRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl px-4 py-3"
          style={{ background: O.card, border: `1px solid ${O.border}`, boxShadow: shadowFloat }}>
          <p className="text-xs mb-1" style={{ color: O.mutedFg }}>{label}</p>
          <p className="text-sm" style={{ fontWeight: 800, color: O.primary, fontFamily: fontHeading }}>
            {payload[0].value}h studied
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen w-full flex" style={{ background: O.bg, color: O.fg, fontFamily: fontBody, position: 'relative' }}>

      {/* Grain texture */}
      <div style={grainStyle} />

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(44,44,36,0.4)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {(sidebarOpen || mobileSidebarOpen) && (
          <motion.aside
            className="fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto flex flex-col"
            style={{
              width: 248,
              background: O.muted,
              borderRight: `1px solid ${O.border}`,
              boxShadow: shadowFloat,
            }}
            initial={{ x: -248 }}
            animate={{ x: 0 }}
            exit={{ x: -248 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: `1px solid ${O.border}` }}>
              <motion.div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: O.primary, boxShadow: shadowSoft }}
                animate={{ boxShadow: [shadowSoft, shadowFloat, shadowSoft] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <GraduationCap size={20} color="#fff" />
              </motion.div>
              <div>
                <p style={{ fontFamily: fontHeading, fontWeight: 700, fontSize: 17, color: O.fg }}>SwapSkill</p>
                <p style={{ fontSize: 10, color: O.mutedFg, fontWeight: 600 }}>Study Platform</p>
              </div>
              <button className="ml-auto lg:hidden" style={{ color: O.mutedFg, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setMobileSidebarOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <p className="px-3 mb-2 text-xs uppercase tracking-widest" style={{ color: O.mutedFg, fontWeight: 700 }}>
                Menu
              </p>

              {navItems.map(({ icon: Icon, label, badge }) => {
                const isActive = activeNav === label;
                const badgeVal = label === 'Skill Exchange' ? pendingCount : badge;
                return (
                  <motion.button
                    key={label}
                    onClick={() => { setActiveNav(label); setMobileSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left relative"
                    style={{
                      background: isActive ? `${O.primary}18` : 'transparent',
                      color: isActive ? O.primary : O.mutedFg,
                      border: isActive ? `1px solid ${O.primary}30` : '1px solid transparent',
                      borderRadius: '1.25rem',
                      cursor: 'pointer',
                      fontFamily: fontBody,
                    }}
                    whileHover={{ x: 4, color: O.primary }}
                    transition={{ duration: 0.15 }}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                        style={{ background: O.primary }}
                        layoutId="activeIndicator"
                      />
                    )}
                    <Icon size={18} />
                    <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 600 }}>{label}</span>
                    {badgeVal != null && badgeVal > 0 && (
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: isActive ? O.primary : `${O.primary}18`,
                          color: isActive ? '#fff' : O.primary,
                          fontWeight: 700, minWidth: 22, textAlign: 'center',
                        }}
                      >
                        {badgeVal}
                      </span>
                    )}
                  </motion.button>
                );
              })}

              {/* Account section */}
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${O.border}` }}>
                <p className="px-3 mb-2 text-xs uppercase tracking-widest" style={{ color: O.mutedFg, fontWeight: 700 }}>
                  Account
                </p>
                <motion.button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-2xl"
                  style={{ color: O.mutedFg, background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontBody }}
                  whileHover={{ x: 4, color: O.fg }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                    style={{ background: O.primary, fontWeight: 800 }}
                  >
                    AJ
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span style={{ fontSize: 14, color: O.fg, fontWeight: 700, lineHeight: 1.2 }}>Alex Johnson</span>
                    <span style={{ fontSize: 11, color: O.primary, fontWeight: 600, lineHeight: 1.2 }}>View Profile</span>
                  </div>
                </motion.button>
                <motion.button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-2xl"
                  style={{ color: O.mutedFg, background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontBody }}
                  whileHover={{ x: 4, color: O.fg }}
                >
                  <Settings size={18} />
                  <span style={{ fontSize: 14 }}>Settings</span>
                </motion.button>
                <motion.button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-2xl"
                  style={{ color: O.mutedFg, background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontBody }}
                  whileHover={{ x: 4, color: '#A85448' }}
                >
                  <LogOut size={18} />
                  <span style={{ fontSize: 14 }}>Logout</span>
                </motion.button>
              </div>
            </nav>

            {/* XP Progress Card */}
            <div
              className="m-3 p-4 rounded-3xl"
              style={{ background: O.card, border: `1px solid ${O.border}80`, boxShadow: shadowSoft }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white shrink-0"
                  style={{ background: O.primary, fontWeight: 800, fontFamily: fontHeading }}
                >
                  AJ
                </div>
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: 13, fontWeight: 700, color: O.fg, fontFamily: fontHeading }}>
                    Alex Johnson
                  </p>
                  <p style={{ fontSize: 11, color: O.primary, fontWeight: 700 }}>Level 12 · 2,840 XP</p>
                </div>
              </div>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: O.mutedFg, fontWeight: 600 }}>
                <span>XP Progress</span>
                <span style={{ color: O.primary }}>2,840 / 3,000</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: O.border }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${O.primary}, ${O.secondary})` }}
                  initial={{ width: 0 }}
                  animate={{ width: '94.7%' }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <header
          className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 py-3"
          style={{
            background: 'rgba(253,252,248,0.82)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${O.border}`,
            boxShadow: shadowSoft,
          }}
        >
          <button
            className="p-2 rounded-xl"
            style={{ color: O.mutedFg, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => {
              if (window.innerWidth >= 1024) setSidebarOpen((p) => !p);
              else setMobileSidebarOpen((p) => !p);
            }}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs hidden sm:flex items-center">
            <Search size={15} className="absolute left-4" style={{ color: O.mutedFg }} />
            <input
              placeholder="Search skills, courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 outline-none transition-all duration-300"
              style={{
                height: 40,
                background: 'rgba(255,255,255,0.6)',
                border: `1px solid ${searchQuery ? O.primary + '60' : O.border}`,
                borderRadius: 9999,
                fontSize: 14,
                color: O.fg,
                fontFamily: fontBody,
                boxShadow: searchQuery ? `0 0 0 3px ${O.primary}15` : 'none',
              }}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Streak */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: `${O.secondary}15`, border: `1px solid ${O.secondary}30` }}
            >
              <Flame size={14} style={{ color: O.secondary }} />
              <span style={{ fontSize: 13, color: O.secondary, fontWeight: 800 }}>7 day streak</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                className="w-10 h-10 rounded-full flex items-center justify-center relative"
                style={{ background: O.muted, border: `1px solid ${O.border}`, cursor: 'pointer' }}
                onClick={() => setNotifOpen((p) => !p)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell size={16} style={{ color: O.mutedFg }} />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: O.secondary }}
                />
              </motion.button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    className="absolute right-0 top-13 w-80 p-4 z-50"
                    style={{
                      background: O.card, border: `1px solid ${O.border}`,
                      borderRadius: '1.5rem', boxShadow: shadowFloat, marginTop: 8,
                    }}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  >
                    <p className="mb-3" style={{ fontFamily: fontHeading, fontWeight: 700, fontSize: 15, color: O.fg }}>
                      Notifications
                    </p>
                    {[
                      { text: 'Alex Turner accepted your swap request', time: '2m ago', dot: O.primary },
                      { text: 'New message from Dr. Sarah Kim', time: '15m ago', dot: O.secondary },
                      { text: 'You earned "Fast Learner" badge!', time: '1h ago', dot: '#B8956A' },
                    ].map((n, i) => (
                      <div
                        key={i}
                        className="flex gap-3 py-2.5"
                        style={{ borderBottom: i < 2 ? `1px solid ${O.border}` : 'none' }}
                      >
                        <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: n.dot }} />
                        <div>
                          <p style={{ fontSize: 13, color: O.fg, fontWeight: 600 }}>{n.text}</p>
                          <p style={{ fontSize: 11, color: O.mutedFg }}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: O.muted, border: `1px solid ${O.border}` }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white"
                style={{ background: O.primary, fontWeight: 800 }}
              >
                AJ
              </div>
              <span className="hidden sm:block text-sm" style={{ color: O.fg, fontWeight: 700 }}>Alex</span>
              <ChevronDown size={14} style={{ color: O.mutedFg }} />
            </div>
          </div>
        </header>

        {/* ── Scrollable Body ── */}
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{ scrollbarWidth: 'thin', scrollbarColor: `${O.border} transparent` }}
        >

          {/* Welcome Banner */}
          <motion.div
            className="relative overflow-hidden p-6 mb-6"
            style={{
              background: O.primary,
              borderRadius: '2.5rem 2rem 3rem 2rem',
              boxShadow: shadowFloat,
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Blob decorations */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 280, height: 280, right: '-5%', top: '-30%',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                filter: 'blur(40px)',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                width: 180, height: 180, right: '20%', bottom: '-20%',
                background: `${O.secondary}40`,
                borderRadius: '40% 60% 70% 30% / 50% 60% 40% 70%',
                filter: 'blur(30px)',
              }}
            />
            {[BookOpen, Lightbulb, Leaf].map((Icon, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ right: `${10 + i * 9}%`, top: `${18 + i * 20}%`, color: 'rgba(243,244,241,0.2)' }}
                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
              >
                <Icon size={30} />
              </motion.div>
            ))}
            <div className="relative z-10">
              <p style={{ color: `${O.primaryFg}cc`, fontSize: 13, fontWeight: 700 }}>Good morning 👋</p>
              <h1 style={{ fontFamily: fontHeading, fontWeight: 800, fontSize: 24, color: O.primaryFg, margin: '4px 0' }}>
                Welcome back, Alex!
              </h1>
              <p style={{ color: `${O.primaryFg}bb`, fontSize: 14 }}>
                You're on a 7-day streak. Keep going — Level 13 is close!
              </p>
              <div className="flex gap-3 mt-4 flex-wrap">
                <motion.button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm"
                  style={{ background: 'rgba(255,255,255,0.18)', color: O.primaryFg, fontWeight: 800, border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', fontFamily: fontBody }}
                  whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.28)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap size={14} style={{ color: O.accent }} /> Continue Learning
                </motion.button>
                <motion.button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm"
                  style={{ background: `${O.secondary}50`, border: `1px solid ${O.secondary}70`, color: O.primaryFg, fontWeight: 800, cursor: 'pointer', fontFamily: fontBody }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Repeat2 size={14} /> Find Swap
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Target}   label="Skills Learned" value="24"   sub="↑ 3 this week"  color={O.primary}   delay={0.1}  radiusIdx={0} />
            <StatCard icon={Clock}    label="Hours Studied"  value="186h" sub="↑ 12h this week" color={O.secondary} delay={0.15} radiusIdx={1} />
            <StatCard icon={Users}    label="Connections"    value="48"   sub="↑ 5 new peers"   color="#8B7355"     delay={0.2}  radiusIdx={2} />
            <StatCard icon={Flame}    label="Day Streak"     value="7 🔥" sub="Personal best!"  color="#B8956A"     delay={0.25} radiusIdx={3} />
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

            {/* Activity Chart */}
            <motion.div
              className="lg:col-span-2 p-5"
              style={{ background: O.card, border: `1px solid ${O.border}80`, borderRadius: '2rem 1.5rem 2rem 1.5rem', boxShadow: shadowSoft }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 style={{ fontFamily: fontHeading, fontWeight: 700, color: O.fg }}>Weekly Activity</h3>
                  <p style={{ fontSize: 13, color: O.mutedFg }}>Hours studied per day</p>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: `${O.primary}14`, border: `1px solid ${O.primary}25` }}
                >
                  <TrendingUp size={14} style={{ color: O.primary }} />
                  <span style={{ fontSize: 13, color: O.primary, fontWeight: 700 }}>+24% vs last week</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={weeklyActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={O.primary} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={O.primary} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${O.border}80`} />
                  <XAxis dataKey="day" tick={{ fill: O.mutedFg, fontSize: 12, fontFamily: fontBody }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: O.mutedFg, fontSize: 12, fontFamily: fontBody }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="hours"
                    stroke={O.primary} strokeWidth={2.5}
                    fill="url(#mossGrad)"
                    dot={{ fill: O.primary, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: O.secondary, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Skill Mastery */}
            <motion.div
              className="p-5"
              style={{ background: O.card, border: `1px solid ${O.border}80`, borderRadius: '1.5rem 2rem 1.5rem 2rem', boxShadow: shadowSoft }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h3 className="mb-1" style={{ fontFamily: fontHeading, fontWeight: 700, color: O.fg }}>Skill Mastery</h3>
              <p style={{ fontSize: 13, color: O.mutedFg, marginBottom: 16 }}>Top skills progress</p>

              <div className="flex justify-around items-center mb-4">
                {skillProgress.map((s) => (
                  <div key={s.id} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <CircularProgress value={s.value} fill={s.fill} size={64} strokeWidth={6} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ fontSize: 11, color: s.fill, fontWeight: 800 }}>{s.value}%</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: O.mutedFg, fontWeight: 600 }}>{s.name}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                {skillProgress.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.fill }} />
                    <span style={{ fontSize: 13, color: O.fg, fontWeight: 600, flex: 1 }}>{s.name}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: O.border }}>
                      <motion.div className="h-full rounded-full" style={{ background: s.fill }}
                        initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                        transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }} />
                    </div>
                    <span style={{ fontSize: 12, color: O.mutedFg, width: 30, textAlign: 'right', fontWeight: 700 }}>
                      {s.value}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Courses + Swap Requests ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* Active Courses */}
            <motion.div className="p-5"
              style={{ background: O.card, border: `1px solid ${O.border}80`, borderRadius: '2rem 1rem 2rem 1rem', boxShadow: shadowSoft }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ fontFamily: fontHeading, fontWeight: 700, color: O.fg }}>Active Courses</h3>
                  <p style={{ fontSize: 13, color: O.mutedFg }}>Continue where you left off</p>
                </div>
                <button
                  className="flex items-center gap-1 text-xs px-4 py-2 rounded-full"
                  style={{ color: O.primary, background: `${O.primary}14`, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: fontBody }}
                >
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {courses.map((c, i) => <CourseCard key={c.id} course={c} delay={0.5 + i * 0.1} />)}
              </div>
            </motion.div>

            {/* Skill Swap Requests */}
            <motion.div className="p-5"
              style={{ background: O.card, border: `1px solid ${O.border}80`, borderRadius: '1rem 2rem 1rem 2rem', boxShadow: shadowSoft }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ fontFamily: fontHeading, fontWeight: 700, color: O.fg }}>Skill Swap Requests</h3>
                  <p style={{ fontSize: 13, color: O.mutedFg }}>People want to learn from you</p>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ background: `${O.secondary}18`, color: O.secondary, fontWeight: 800, border: `1px solid ${O.secondary}30` }}
                >
                  {pendingCount} pending
                </span>
              </div>
              <div className="space-y-3">
                {swapRequests.map((req, i) => (
                  <motion.div
                    key={req.id}
                    className="p-3.5 rounded-2xl"
                    style={{
                      background: req.status === 'accepted' ? `${O.primary}0c`
                               : req.status === 'declined' ? `${'#A85448'}08`
                               : O.muted,
                      border: `1px solid ${
                        req.status === 'accepted' ? O.primary + '30'
                        : req.status === 'declined' ? '#A8544830'
                        : O.border + '60'}`,
                      opacity: req.status === 'declined' ? 0.6 : 1,
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: req.status === 'declined' ? 0.6 : 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={req.status === 'pending' ? { y: -2 } : {}}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs shrink-0 font-bold text-white"
                        style={{ background: req.color }}
                      >
                        {req.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p style={{ fontSize: 13, fontWeight: 700, color: O.fg }}>{req.name}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: O.accent, color: O.accentFg, fontWeight: 600 }}>
                            {req.level}
                          </span>
                          {req.status === 'accepted' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: `${O.primary}18`, color: O.primary, fontWeight: 700 }}>
                              Accepted
                            </span>
                          )}
                          {req.status === 'declined' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: '#A8544815', color: '#A85448', fontWeight: 700 }}>
                              Declined
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${O.primary}14`, color: O.primary, fontWeight: 600 }}>
                            <Zap size={10} /> {req.offer}
                          </span>
                          <Repeat2 size={12} style={{ color: O.mutedFg }} />
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${O.secondary}14`, color: O.secondary, fontWeight: 600 }}>
                            <Star size={10} /> {req.want}
                          </span>
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-1.5 shrink-0">
                          <motion.button
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: `${O.primary}18`, color: O.primary, border: 'none', cursor: 'pointer' }}
                            whileHover={{ scale: 1.15, background: `${O.primary}30` }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSwap(req.id, 'accepted')}
                            title="Accept"
                          >
                            <CheckCircle2 size={15} />
                          </motion.button>
                          <motion.button
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: '#A8544812', color: '#A85448', border: 'none', cursor: 'pointer' }}
                            whileHover={{ scale: 1.15, background: '#A8544825' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSwap(req.id, 'declined')}
                            title="Decline"
                          >
                            <XCircle size={15} />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Leaderboard + Schedule ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* Leaderboard */}
            <motion.div className="p-5"
              style={{ background: O.card, border: `1px solid ${O.border}80`, borderRadius: '2rem', boxShadow: shadowSoft }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ fontFamily: fontHeading, fontWeight: 700, color: O.fg }}>Leaderboard</h3>
                  <p style={{ fontSize: 13, color: O.mutedFg }}>Top learners this week</p>
                </div>
                <Trophy size={20} style={{ color: O.secondary }} />
              </div>
              <div className="space-y-2.5">
                {leaderboard.map((user, i) => (
                  <motion.div
                    key={user.rank}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{
                      background: user.isUser ? `${O.primary}10` : O.muted,
                      border: `1px solid ${user.isUser ? O.primary + '30' : O.border + '50'}`,
                    }}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.07 }}
                  >
                    <div className="w-6 text-center shrink-0"
                      style={{ fontWeight: 800, fontSize: 13, color: user.rank <= 3 ? O.secondary : O.mutedFg }}>
                      {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank}
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold text-white"
                      style={{ background: user.color }}
                    >
                      {user.avatar}
                    </div>
                    <span className="flex-1 text-sm"
                      style={{ color: user.isUser ? O.primary : O.fg, fontWeight: user.isUser ? 800 : 600 }}>
                      {user.name} {user.isUser && <span style={{ color: O.mutedFg, fontWeight: 400 }}>(you)</span>}
                    </span>
                    <div className="text-right">
                      <p style={{ fontSize: 13, color: O.primary, fontWeight: 800 }}>{user.xp.toLocaleString()}</p>
                      <p style={{ fontSize: 11, color: O.mutedFg }}>XP</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Today's Schedule */}
            <motion.div className="p-5"
              style={{ background: O.card, border: `1px solid ${O.border}80`, borderRadius: '2rem', boxShadow: shadowSoft }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ fontFamily: fontHeading, fontWeight: 700, color: O.fg }}>Today's Schedule</h3>
                  <p style={{ fontSize: 13, color: O.mutedFg }}>Friday, June 13, 2026</p>
                </div>
                <button
                  className="flex items-center gap-1 text-xs px-4 py-2 rounded-full"
                  style={{ color: O.primary, background: `${O.primary}14`, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: fontBody }}
                >
                  <Calendar size={12} /> Full Calendar
                </button>
              </div>
              <div className="space-y-3">
                {upcomingSessions.map((session, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4 p-4 rounded-2xl relative overflow-hidden cursor-pointer group"
                    style={{ background: O.muted, border: `1px solid ${O.border}60` }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    whileHover={{ y: -2, boxShadow: shadowSoft }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: session.color }} />
                    <div className="pl-2 flex-1">
                      <p style={{ fontSize: 12, color: O.mutedFg, marginBottom: 3, fontWeight: 600 }}>{session.time}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: O.fg, fontFamily: fontHeading }}>
                        {session.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12, color: O.mutedFg }}>with {session.with}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${session.color}18`, color: session.color, fontWeight: 700, border: `1px solid ${session.color}25` }}
                        >
                          {session.type}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center">
                      <motion.button
                        className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                        style={{ background: session.color, border: 'none', cursor: 'pointer' }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Play size={12} color="#fff" style={{ marginLeft: 2 }} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.button
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm"
                style={{ background: 'transparent', border: `1.5px dashed ${O.border}`, color: O.mutedFg, cursor: 'pointer', fontFamily: fontBody, fontWeight: 600 }}
                whileHover={{ background: `${O.primary}08`, color: O.primary, borderColor: O.primary + '40' }}
              >
                + Schedule a session
              </motion.button>
            </motion.div>
          </div>

          {/* ── Quick Actions ── */}
          <motion.div className="p-5"
            style={{ background: O.card, border: `1px solid ${O.border}80`, borderRadius: '2rem', boxShadow: shadowSoft }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <h3 className="mb-4" style={{ fontFamily: fontHeading, fontWeight: 700, color: O.fg }}>Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Repeat2,       label: 'New Swap',       color: O.primary,   bg: `${O.primary}12`   },
                { icon: BookOpen,      label: 'Browse Courses', color: O.secondary, bg: `${O.secondary}12` },
                { icon: Users,         label: 'Find Mentor',    color: '#8B7355',   bg: '#8B735512'         },
                { icon: MessageSquare, label: 'Study Group',    color: '#7A8C6E',   bg: '#7A8C6E12'         },
              ].map(({ icon: Icon, label, color, bg }, i) => (
                <motion.button
                  key={label}
                  className="flex flex-col items-center gap-3 py-6 rounded-3xl group"
                  style={{ background: bg, border: `1px solid ${color}25`, cursor: 'pointer', fontFamily: fontBody }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.65 + i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4, boxShadow: shadowSoft }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <span style={{ fontSize: 13, color: O.fg, fontWeight: 700 }}>{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}
