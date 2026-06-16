import { useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap, Repeat2, Users, BookOpen, Trophy, MessageSquare,
  Star, ArrowRight, CheckCircle2, Zap, Target, Clock,
  Play, TrendingUp, Shield, Leaf, Menu, X,
} from 'lucide-react';
import { useLandingStats, useLandingTestimonials, useReviewStats, useSocialProofUsers } from '@/hooks/useLandingStats';

// ── Design Tokens ──────────────────────────────────────────────────────────────
const O = {
  bg:         '#FDFCF8',   // rice paper
  fg:         '#2C2C24',   // deep loam
  primary:    '#5D7052',   // moss green
  primaryFg:  '#F3F4F1',   // pale mist
  secondary:  '#C18C5D',   // terracotta
  accent:     '#E6DCCD',   // sand
  accentFg:   '#4A4A40',   // bark
  muted:      '#F0EBE5',   // stone
  mutedFg:    '#78786C',   // dried grass
  border:     '#DED8CF',   // raw timber
  card:       '#FEFEFA',   // cream white
};

const shadowSoft  = '0 4px 20px -2px rgba(93,112,82,0.15)';
const shadowFloat = '0 10px 40px -10px rgba(193,140,93,0.2)';
const shadowHover = '0 20px 40px -10px rgba(93,112,82,0.18)';

// Asymmetric border-radius patterns for cards (cycles through 6)
const blobRadii = [
  '2rem',
  '4rem 2rem 2rem 2rem',
  '2rem 2rem 4rem 2rem',
  '2rem 4rem 2rem 4rem',
  '3rem 2rem 3rem 2rem',
  '2rem 3rem 2rem 3rem',
];

// ── Grain texture overlay ──────────────────────────────────────────────────────
// SVG turbulence noise rendered as a small data-URI, tiled and overlaid
const grainStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundSize: '128px 128px',
  opacity: 0.035,
  mixBlendMode: 'multiply',
};

// ── Ambient blob ──────────────────────────────────────────────────────────────
function Blob({ color, size, x, y, opacity = 0.25 }: {
  color: string; size: number; x: string; y: string; opacity?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        width: size,
        height: size,
        left: x,
        top: y,
        background: color,
        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        filter: 'blur(80px)',
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const features = [
  { icon: Repeat2,       title: 'Skill Exchange',      desc: 'Trade expertise directly with peers. Teach what you know, learn what you need — no money, just knowledge.',        color: O.primary   },
  { icon: BookOpen,      title: 'Structured Courses',  desc: 'Follow curated learning paths built by experts with built-in progress tracking and milestone celebrations.',        color: O.secondary },
  { icon: Users,         title: 'Study Groups',        desc: 'Join focused cohorts tackling the same goals. Accountability, collaboration, and shared breakthroughs.',           color: O.primary   },
  { icon: Trophy,        title: 'Gamified Progress',   desc: 'Earn XP, climb leaderboards, and unlock badges as you master skills and help others grow.',                       color: O.secondary },
  { icon: MessageSquare, title: 'Live Sessions',       desc: 'Schedule 1-on-1 or group video sessions with your swap partners. Real-time learning, real results.',              color: O.primary   },
  { icon: Shield,        title: 'Verified Profiles',   desc: 'Every skill claim is backed by peer reviews, project showcases, and session history you can trust.',              color: O.secondary },
];

const steps = [
  { num: '01', title: 'Create Your Profile',   desc: 'List the skills you have and the skills you want. Add portfolio pieces, set your availability, and tell the community what drives you.' },
  { num: '02', title: 'Find Your Match',        desc: 'Our matching surfaces people with complementary skill sets. Browse requests, filter by level, or post a swap offer yourself.'           },
  { num: '03', title: 'Start Swapping',         desc: 'Schedule sessions, track progress together, and leave reviews. Watch your skills and reputation grow with every exchange.'              },
];

// Real-time data is now fetched via useLandingStats and useLandingTestimonials hooks
// Old hardcoded values removed in favor of live data

const navLinks = ['Features', 'How it Works', 'Community', 'Pricing'];

// ── Component ─────────────────────────────────────────────────────────────────
interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail]           = useState('');
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  // Fetch real-time data
  const { stats, loading: statsLoading } = useLandingStats();
  const { testimonials, loading: testimonialsLoading } = useLandingTestimonials();
  const { reviews } = useReviewStats();
  const { users: socialUsers, totalUsers } = useSocialProofUsers();

  const fontBody    = "'Nunito', sans-serif";
  const fontHeading = "'Fraunces', serif";

  return (
    <div
      style={{
        background: O.bg,
        color: O.fg,
        fontFamily: fontBody,
        minHeight: '100vh',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Paper grain overlay */}
      <div style={grainStyle} />

      {/* ── Floating Pill Nav ── */}
      <div className="sticky top-4 z-50 px-4 sm:px-6">
        <nav
          style={{
            background: 'rgba(253,252,248,0.75)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${O.border}80`,
            borderRadius: 9999,
            boxShadow: shadowSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            maxWidth: 1200,
            margin: '0 auto',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9999,
                background: O.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: fontHeading, fontWeight: 700, fontSize: 17, color: O.fg }}>
              SwapSkill
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <button
                key={l}
                style={{ fontSize: 14, color: O.mutedFg, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontBody }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = O.primary)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = O.mutedFg)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onSignIn}
              style={{
                fontSize: 14, fontWeight: 700, color: O.primary,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 16px', fontFamily: fontBody,
              }}
            >
              Sign in
            </button>
            <motion.button
              onClick={onGetStarted}
              style={{
                background: O.primary, color: O.primaryFg,
                border: 'none', borderRadius: 9999,
                padding: '10px 24px', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', boxShadow: shadowSoft, fontFamily: fontBody,
              }}
              whileHover={{ scale: 1.05, boxShadow: shadowHover }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free
            </motion.button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen((p) => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: O.fg }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: O.card,
              border: `1px solid ${O.border}`,
              borderRadius: '2rem',
              padding: 24,
              marginTop: 8,
              boxShadow: shadowFloat,
              maxWidth: 1200,
              margin: '8px auto 0',
            }}
          >
            {navLinks.map((l) => (
              <button
                key={l}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 8px', fontSize: 15, fontWeight: 600,
                  color: O.fg, background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: fontBody,
                  borderBottom: `1px solid ${O.border}50`,
                }}
              >
                {l}
              </button>
            ))}
            <motion.button
              onClick={onGetStarted}
              style={{
                marginTop: 16, width: '100%', background: O.primary,
                color: O.primaryFg, border: 'none', borderRadius: 9999,
                padding: '14px 24px', fontSize: 15, fontWeight: 800,
                cursor: 'pointer', fontFamily: fontBody,
              }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started Free
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* ── Hero ── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(60px,10vw,120px) clamp(20px,5vw,80px)',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {/* Ambient blobs */}
        <Blob color={O.primary}    size={480} x="-8%"  y="-10%" opacity={0.12} />
        <Blob color={O.secondary}  size={360} x="60%"  y="5%"   opacity={0.1}  />
        <Blob color={O.accent}     size={280} x="15%"  y="55%"  opacity={0.15} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${O.primary}15`,
              border: `1px solid ${O.primary}30`,
              borderRadius: 9999,
              padding: '6px 16px',
              marginBottom: 28,
            }}
          >
            <Leaf size={14} color={O.primary} />
            <span style={{ fontSize: 13, color: O.primary, fontWeight: 700 }}>
              42,000+ learners swapping skills
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{
              fontFamily: fontHeading,
              fontWeight: 800,
              fontSize: 'clamp(2.6rem, 6vw, 5rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: O.fg,
              marginBottom: 20,
            }}
          >
            Learn anything.{' '}
            <span style={{ color: O.primary, fontStyle: 'italic' }}>Teach something.</span>
            <br />
            Grow together.
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontSize: 18, color: O.mutedFg, lineHeight: 1.75,
              marginBottom: 40, maxWidth: 540,
            }}
          >
            SwapSkill is the study exchange platform where your expertise is currency. Trade skills
            directly with peers, follow structured courses, and build a portfolio that proves what you know.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 52 }}
          >
            <motion.button
              onClick={onGetStarted}
              style={{
                background: O.primary, color: O.primaryFg,
                border: 'none', borderRadius: 9999,
                padding: '16px 36px', fontSize: 16, fontWeight: 800,
                cursor: 'pointer', boxShadow: shadowSoft,
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: fontBody,
              }}
              whileHover={{ scale: 1.05, boxShadow: shadowHover }}
              whileTap={{ scale: 0.95 }}
            >
              Start Swapping Free <ArrowRight size={18} />
            </motion.button>
            <motion.button
              style={{
                background: 'transparent',
                border: `2px solid ${O.secondary}`,
                borderRadius: 9999,
                padding: '16px 32px', fontSize: 16, fontWeight: 700,
                color: O.secondary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: fontBody,
              }}
              whileHover={{ scale: 1.05, background: `${O.secondary}10` }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={16} /> Watch Demo
            </motion.button>
          </motion.div>

          {/* Social proof avatars — real users from Supabase, realtime */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}
          >
            {socialUsers.length > 0 ? (
              <>
                <div style={{ display: 'flex' }}>
                  {socialUsers.map((u, i) => (
                    <div
                      key={u.id}
                      title={u.initials}
                      style={{
                        width: 38, height: 38, borderRadius: 9999,
                        background: u.color, border: `3px solid ${O.bg}`,
                        marginLeft: i > 0 ? -12 : 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: '#fff',
                        zIndex: socialUsers.length - i,
                        position: 'relative',
                      }}
                    >
                      {u.initials}
                    </div>
                  ))}
                </div>
                <div>
                  {reviews.totalReviews > 0 ? (
                    <>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                        {[...Array(5)].map((_, i) => {
                          const filled = reviews.averageRating >= i + 1;
                          const half = !filled && reviews.averageRating >= i + 0.5;
                          return (
                            <Star
                              key={i}
                              size={13}
                              color={O.secondary}
                              fill={filled || half ? O.secondary : 'none'}
                              strokeWidth={filled || half ? 0 : 2}
                            />
                          );
                        })}
                      </div>
                      <p style={{ fontSize: 13, color: O.mutedFg }}>
                        <strong style={{ color: O.primary }}>{reviews.averageRating}/5</strong>
                        {' '}from{' '}
                        <strong style={{ color: O.primary }}>{reviews.totalReviews.toLocaleString()}</strong>
                        {' '}real reviews
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: O.mutedFg }}>
                      <strong style={{ color: O.primary }}>{totalUsers.toLocaleString()}</strong>
                      {' '}learner{totalUsers !== 1 ? 's' : ''} already joined
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9999,
                  background: `${O.primary}20`, border: `3px dashed ${O.primary}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  🌱
                </div>
                <p style={{ fontSize: 13, color: O.mutedFg }}>
                  <strong style={{ color: O.primary }}>Be the first</strong> to join our community!
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Hero mini-dashboard preview — organic card shape */}
        <motion.div
          className="hidden lg:block absolute"
          style={{ right: 0, top: 60, width: '38%' }}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <div
            style={{
              background: O.card,
              border: `1px solid ${O.border}80`,
              borderRadius: '3rem 2rem 4rem 2rem',
              padding: 24,
              boxShadow: shadowFloat,
              transform: 'rotate(1.5deg)',
            }}
          >
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {['Skills Learned', 'Hours Studied', 'Connections'].map((label, i) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: i === 0 ? `${O.primary}12` : i === 1 ? `${O.secondary}12` : O.muted,
                    borderRadius: '1.2rem',
                    padding: '10px 12px',
                    border: `1px solid ${O.border}60`,
                  }}
                >
                  <p style={{
                    fontSize: 20, fontWeight: 800,
                    color: i === 0 ? O.primary : i === 1 ? O.secondary : O.accentFg,
                    fontFamily: fontHeading, lineHeight: 1,
                  }}>
                    {['24', '186h', '48'][i]}
                  </p>
                  <p style={{ fontSize: 10, color: O.mutedFg, marginTop: 3 }}>{label}</p>
                </div>
              ))}
            </div>
            <div
              style={{
                background: O.muted,
                borderRadius: '1rem',
                padding: '10px 14px',
                marginBottom: 10,
                border: `1px solid ${O.border}50`,
              }}
            >
              <p style={{ fontSize: 10, color: O.mutedFg, marginBottom: 8, fontWeight: 700, letterSpacing: '0.06em' }}>
                WEEKLY ACTIVITY
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 44 }}>
                {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                  <motion.div
                    key={i}
                    style={{
                      flex: 1, borderRadius: 4,
                      background: i % 2 === 0 ? O.primary : O.secondary,
                      opacity: 0.7,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.6 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { name: 'Python Dev', offer: 'React.js', want: 'Figma', color: O.primary },
                { name: 'Data Analyst', offer: 'SQL', want: 'ML Basics', color: O.secondary },
              ].map((req) => (
                <div
                  key={req.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: '1rem',
                    background: O.bg, border: `1px solid ${O.border}60`,
                  }}
                >
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: 9999,
                      background: req.color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff',
                    }}
                  >
                    {req.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: O.fg, fontWeight: 700 }}>{req.name}</p>
                    <p style={{ fontSize: 10, color: O.mutedFg }}>
                      Offers {req.offer} → Wants {req.want}
                    </p>
                  </div>
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: 9999,
                      background: `${O.primary}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={12} color={O.primary} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <section
        style={{
          background: O.muted,
          borderTop: `1px solid ${O.border}`,
          borderBottom: `1px solid ${O.border}`,
          padding: '48px clamp(20px,5vw,80px)',
        }}
      >
        <div
          style={{
            maxWidth: 1080, margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'repeat(2,1fr)',
            gap: '32px 48px',
          }}
          className="md:grid-cols-4"
        >
          {[
            { value: `${statsLoading ? '...' : (stats.activeLearners / 1000).toFixed(0)}K+`, label: 'Active Learners', icon: Users },
            { value: `${statsLoading ? '...' : stats.skillsAvailable}+`, label: 'Skills Available', icon: Target },
            { value: `${statsLoading ? '...' : (stats.sessionsCompleted / 1000).toFixed(0)}K`, label: 'Sessions Completed', icon: Clock },
            { value: `${statsLoading ? '...' : stats.averageRating}★`, label: 'Average Rating', icon: Star },
          ].map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <p
                style={{
                  fontFamily: fontHeading, fontWeight: 800,
                  fontSize: 'clamp(2rem,4vw,2.75rem)',
                  color: i % 2 === 0 ? O.primary : O.secondary,
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
              <p style={{ fontSize: 14, color: O.mutedFg, marginTop: 6, fontWeight: 600 }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: 'clamp(64px,10vw,120px) clamp(20px,5vw,80px)', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: 60 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span
            style={{
              display: 'inline-block',
              background: `${O.secondary}18`,
              border: `1px solid ${O.secondary}40`,
              borderRadius: 9999,
              padding: '5px 18px',
              fontSize: 12, fontWeight: 700,
              color: O.secondary,
              letterSpacing: '0.08em',
              marginBottom: 18,
              textTransform: 'uppercase',
            }}
          >
            Platform Features
          </span>
          <h2
            style={{
              fontFamily: fontHeading, fontWeight: 800,
              fontSize: 'clamp(1.8rem,4vw,3rem)',
              letterSpacing: '-0.02em', color: O.fg,
              marginBottom: 14,
            }}
          >
            Everything you need to{' '}
            <span style={{ color: O.primary, fontStyle: 'italic' }}>grow faster</span>
          </h2>
          <p style={{ fontSize: 17, color: O.mutedFg, maxWidth: 480, margin: '0 auto' }}>
            Built for learners who want more than lectures — real exchanges, real accountability, real results.
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))',
            gap: 24,
          }}
        >
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              style={{
                background: O.card,
                border: `1px solid ${hoveredFeature === i ? feat.color + '50' : O.border + '80'}`,
                borderRadius: blobRadii[i % blobRadii.length],
                padding: '28px 28px 32px',
                cursor: 'pointer',
                boxShadow: hoveredFeature === i ? shadowHover : shadowSoft,
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
              }}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              whileHover={{ y: -4 }}
            >
              {/* Icon container */}
              <div
                style={{
                  width: 56, height: 56,
                  borderRadius: '1rem',
                  background: hoveredFeature === i ? feat.color : `${feat.color}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                  transition: 'background 0.3s ease',
                }}
              >
                <feat.icon size={26} color={hoveredFeature === i ? '#fff' : feat.color} />
              </div>
              <h3
                style={{
                  fontFamily: fontHeading, fontWeight: 700,
                  fontSize: 18, color: O.fg, marginBottom: 10,
                }}
              >
                {feat.title}
              </h3>
              <p style={{ fontSize: 14, color: O.mutedFg, lineHeight: 1.7 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── (stone tint bg) */}
      <section
        style={{
          background: `${O.accent}40`,
          borderTop: `1px solid ${O.border}`,
          borderBottom: `1px solid ${O.border}`,
          padding: 'clamp(64px,10vw,120px) clamp(20px,5vw,80px)',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div
            style={{ textAlign: 'center', marginBottom: 60 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span
              style={{
                display: 'inline-block',
                background: `${O.primary}15`,
                border: `1px solid ${O.primary}30`,
                borderRadius: 9999,
                padding: '5px 18px',
                fontSize: 12, fontWeight: 700,
                color: O.primary, letterSpacing: '0.08em',
                marginBottom: 18, textTransform: 'uppercase',
              }}
            >
              How It Works
            </span>
            <h2
              style={{
                fontFamily: fontHeading, fontWeight: 800,
                fontSize: 'clamp(1.8rem,4vw,3rem)',
                letterSpacing: '-0.02em', color: O.fg,
              }}
            >
              Three steps to your next skill
            </h2>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
              gap: 36,
            }}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div
                  style={{
                    fontFamily: fontHeading, fontWeight: 800,
                    fontSize: '3.5rem', lineHeight: 1,
                    color: i % 2 === 0 ? `${O.primary}40` : `${O.secondary}40`,
                    marginBottom: 12,
                    fontStyle: 'italic',
                  }}
                >
                  {step.num}
                </div>
                <h3
                  style={{
                    fontFamily: fontHeading, fontWeight: 700,
                    fontSize: 20, color: O.fg, marginBottom: 10,
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: O.mutedFg, lineHeight: 1.7 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: 'clamp(64px,10vw,120px) clamp(20px,5vw,80px)', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: 56 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span
            style={{
              display: 'inline-block',
              background: `${O.secondary}18`,
              border: `1px solid ${O.secondary}40`,
              borderRadius: 9999,
              padding: '5px 18px', fontSize: 12, fontWeight: 700,
              color: O.secondary, letterSpacing: '0.08em',
              marginBottom: 18, textTransform: 'uppercase',
            }}
          >
            Success Stories
          </span>
          <h2
            style={{
              fontFamily: fontHeading, fontWeight: 800,
              fontSize: 'clamp(1.8rem,4vw,3rem)',
              letterSpacing: '-0.02em', color: O.fg,
            }}
          >
            Skills exchanged,{' '}
            <span style={{ color: O.secondary, fontStyle: 'italic' }}>careers changed</span>
          </h2>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
            gap: 24,
          }}
        >
          {testimonialsLoading ? (
            <p style={{ color: O.mutedFg, textAlign: 'center', gridColumn: '1/-1', padding: '40px 20px' }}>
              Loading success stories...
            </p>
          ) : testimonials && testimonials.length > 0 ? (
            testimonials.map((t, i) => (
              <motion.div
                key={`${t.name}-${i}`}
                style={{
                  background: O.card,
                  border: `1px solid ${O.border}80`,
                  borderRadius: blobRadii[(i + 2) % blobRadii.length],
                  padding: '30px 28px',
                  boxShadow: shadowSoft,
                }}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
                whileHover={{ y: -4, rotate: 0.8, boxShadow: shadowFloat }}
              >
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} size={14} color={O.secondary} fill={O.secondary} />
                  ))}
                </div>
                <p style={{ fontSize: 15, color: O.mutedFg, lineHeight: 1.75, marginBottom: 22, fontStyle: 'italic' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42, height: 42, borderRadius: 9999,
                      background: i % 2 === 0 ? O.primary : O.secondary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, color: '#fff',
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontFamily: fontHeading, fontWeight: 700, fontSize: 15, color: O.fg }}>
                      {t.name}
                    </p>
                    <p style={{ fontSize: 12, color: O.mutedFg }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <p style={{ color: O.mutedFg, textAlign: 'center', gridColumn: '1/-1', padding: '40px 20px' }}>
              Be the first to share your success story!
            </p>
          )}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        style={{
          background: O.muted,
          borderTop: `1px solid ${O.border}`,
          borderBottom: `1px solid ${O.border}`,
          padding: 'clamp(64px,10vw,120px) clamp(20px,5vw,80px)',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div
            style={{ textAlign: 'center', marginBottom: 56 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span
              style={{
                display: 'inline-block',
                background: `${O.primary}15`,
                border: `1px solid ${O.primary}30`,
                borderRadius: 9999,
                padding: '5px 18px',
                fontSize: 12, fontWeight: 700,
                color: O.primary, letterSpacing: '0.08em',
                marginBottom: 18, textTransform: 'uppercase',
              }}
            >
              Pricing
            </span>
            <h2
              style={{
                fontFamily: fontHeading, fontWeight: 800,
                fontSize: 'clamp(1.8rem,4vw,3rem)',
                letterSpacing: '-0.02em', color: O.fg,
                marginBottom: 12,
              }}
            >
              Free forever.{' '}
              <span style={{ color: O.primary, fontStyle: 'italic' }}>No catch.</span>
            </h2>
            <p style={{ fontSize: 17, color: O.mutedFg, maxWidth: 480, margin: '0 auto' }}>
              SwapSkill runs on the power of reciprocity. Your knowledge is your currency — no subscriptions, no paywalls.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              {
                name: 'Community',
                price: 'Free',
                sub: 'Always free, forever',
                color: O.primary,
                features: [
                  'Unlimited skill swaps',
                  'Real-time messaging',
                  'Community rooms',
                  'XP & leaderboard',
                  'Session scheduling',
                  'Peer reviews & ratings',
                ],
                cta: 'Get Started Free',
                highlight: false,
              },
              {
                name: 'Mentor',
                price: 'Free',
                sub: 'Earn through teaching',
                color: O.secondary,
                features: [
                  'Everything in Community',
                  'Verified Mentor badge',
                  'Priority discovery ranking',
                  'Advanced analytics',
                  'Custom session pricing',
                  'Group session hosting',
                ],
                cta: 'Become a Mentor',
                highlight: true,
              },
              {
                name: 'Institution',
                price: 'Contact us',
                sub: 'For schools & orgs',
                color: '#8B7355',
                features: [
                  'Everything in Mentor',
                  'Custom branding',
                  'Admin dashboard',
                  'SSO / SAML auth',
                  'Bulk user management',
                  'Priority support',
                ],
                cta: 'Contact Sales',
                highlight: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                style={{
                  background: plan.highlight ? O.primary : O.card,
                  border: `2px solid ${plan.highlight ? O.primary : O.border + '80'}`,
                  borderRadius: '2.5rem',
                  padding: '36px 32px',
                  position: 'relative',
                  boxShadow: plan.highlight ? '0 20px 50px -12px rgba(93,112,82,0.35)' : shadowSoft,
                }}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                      background: O.secondary, color: '#fff',
                      padding: '4px 20px', borderRadius: 9999,
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <p
                  style={{
                    fontFamily: fontHeading, fontWeight: 700, fontSize: 18,
                    color: plan.highlight ? O.primaryFg : O.fg, marginBottom: 4,
                  }}
                >
                  {plan.name}
                </p>
                <p
                  style={{
                    fontFamily: fontHeading, fontWeight: 800,
                    fontSize: 'clamp(2rem,4vw,2.8rem)',
                    color: plan.highlight ? '#fff' : plan.color, lineHeight: 1.1,
                  }}
                >
                  {plan.price}
                </p>
                <p style={{ fontSize: 13, color: plan.highlight ? `${O.primaryFg}99` : O.mutedFg, marginBottom: 28 }}>
                  {plan.sub}
                </p>
                <div style={{ borderTop: `1px solid ${plan.highlight ? 'rgba(255,255,255,0.2)' : O.border + '60'}`, paddingTop: 24, marginBottom: 28 }}>
                  {plan.features.map((feat) => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 18, height: 18, borderRadius: 9999, flexShrink: 0,
                          background: plan.highlight ? 'rgba(255,255,255,0.25)' : `${plan.color}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <CheckCircle2 size={11} color={plan.highlight ? '#fff' : plan.color} />
                      </div>
                      <span style={{ fontSize: 14, color: plan.highlight ? `${O.primaryFg}dd` : O.mutedFg }}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
                <motion.button
                  onClick={onGetStarted}
                  style={{
                    width: '100%',
                    background: plan.highlight ? O.primaryFg : plan.color,
                    color: plan.highlight ? O.primary : '#fff',
                    border: 'none', borderRadius: 9999,
                    padding: '14px 24px', fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', fontFamily: fontBody,
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── (moss green background) */}
      <section style={{ padding: 'clamp(64px,10vw,120px) clamp(20px,5vw,80px)' }}>
        <motion.div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: O.primary,
            borderRadius: '3rem',
            padding: 'clamp(48px,8vw,80px)',
            textAlign: 'center',
            maxWidth: 860,
            margin: '0 auto',
            boxShadow: shadowFloat,
          }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Decorative blobs inside CTA */}
          <Blob color="#fff" size={320} x="-10%" y="-20%" opacity={0.04} />
          <Blob color={O.secondary} size={240} x="70%" y="30%" opacity={0.15} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              style={{
                fontFamily: fontHeading, fontWeight: 800,
                fontSize: 'clamp(1.8rem,4vw,3rem)',
                letterSpacing: '-0.02em',
                color: O.primaryFg, marginBottom: 14,
              }}
            >
              Ready to swap your first skill?
            </h2>
            <p style={{ fontSize: 17, color: `${O.primaryFg}cc`, marginBottom: 36, maxWidth: 420, margin: '0 auto 36px' }}>
              Join 42,000+ learners who stopped paying for courses and started trading knowledge instead.
            </p>

            {/* Email + CTA row */}
            <div
              style={{
                display: 'flex', flexWrap: 'wrap',
                gap: 12, justifyContent: 'center', alignItems: 'center',
              }}
            >
              <input
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'rgba(253,252,248,0.15)',
                  border: '1px solid rgba(243,244,241,0.3)',
                  borderRadius: 9999,
                  padding: '14px 24px',
                  fontSize: 15, color: O.primaryFg,
                  outline: 'none',
                  width: 260,
                  fontFamily: fontBody,
                }}
              />
              <motion.button
                onClick={onGetStarted}
                style={{
                  background: O.primaryFg, color: O.primary,
                  border: 'none', borderRadius: 9999,
                  padding: '14px 32px', fontSize: 15, fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: fontBody,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start for Free <ArrowRight size={16} />
              </motion.button>
            </div>
            <p style={{ fontSize: 12, color: `${O.primaryFg}80`, marginTop: 16 }}>
              No credit card required · Free forever plan available
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: `1px solid ${O.border}`,
          padding: '36px clamp(20px,5vw,80px)',
        }}
      >
        <div
          style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 9999,
                background: O.primary, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <GraduationCap size={15} color="#fff" />
            </div>
            <span style={{ fontFamily: fontHeading, fontWeight: 700, fontSize: 15, color: O.fg }}>
              SwapSkill
            </span>
          </div>
          <p style={{ fontSize: 13, color: O.mutedFg }}>
            © 2026 SwapSkill. Built by learners, for learners.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <button
                key={l}
                style={{ fontSize: 13, color: O.mutedFg, background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontBody }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = O.primary)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = O.mutedFg)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
