import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fff8f5 0%, #fff2ec 50%, #ffeee5 100%)' }}>

      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm z-20"
        style={{ color: '#8a7e76', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back
      </Link>

      <motion.div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative z-10"
        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
      >
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 rounded-full shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #5D7052, #C18C5D)' }}>
            <GraduationCap size={48} className="text-white" />
          </div>
          <h1 className="text-5xl mb-4" style={{ fontFamily: "'Fraunces', serif", color: '#2C2C24', fontWeight: 800 }}>
            SkillSwap
          </h1>
          <p className="text-xl" style={{ color: '#78786C' }}>
            Trade knowledge, not money. Free forever.
          </p>
        </div>
      </motion.div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12"
          style={{ boxShadow: '0 25px 60px rgba(248,142,128,0.15)' }}
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #5D7052, #C18C5D)' }}>
              <GraduationCap size={32} className="text-white" />
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 24 }}>SkillSwap</h2>
          </div>

          <h3 className="text-2xl mb-2" style={{ color: '#2C2C24', fontFamily: "'Fraunces', serif" }}>Welcome Back</h3>
          <p className="mb-8 text-sm" style={{ color: '#78786C' }}>Sign in to continue swapping skills</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ background: '#A8544815', color: '#A85448' }}>{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A8A28A' }} size={20} />
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="pl-12 h-12" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A8A28A' }} size={20} />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} className="pl-12 pr-12 h-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#A8A28A', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl text-white text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #5D7052, #C18C5D)', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm" style={{ color: '#8a7e76' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#5D7052', fontWeight: 600 }}>Sign up free</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
