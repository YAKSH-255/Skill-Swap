import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8 relative"
      style={{ background: 'linear-gradient(135deg, #fff8f5 0%, #fff2ec 50%, #ffeee5 100%)' }}>
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm"
        style={{ color: '#8a7e76', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back
      </Link>

      <motion.div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12"
        style={{ boxShadow: '0 25px 60px rgba(248,142,128,0.15)' }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #5D7052, #C18C5D)' }}>
            <GraduationCap size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#2C2C24', fontFamily: "'Fraunces', serif" }}>
            Join SkillSwap
          </h2>
          <p className="text-sm mt-1" style={{ color: '#78786C' }}>Free forever · No credit card required</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <p style={{ color: '#5D7052', fontWeight: 700 }}>Account created! Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl text-sm" style={{ background: '#A8544815', color: '#A85448' }}>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A8A28A' }} size={20} />
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="pl-12 h-12" placeholder="Alex Johnson" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A8A28A' }} size={20} />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12" placeholder="you@example.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A8A28A' }} size={20} />
                <Input id="password" type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12" placeholder="Min 6 characters" minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#A8A28A', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl text-white text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #5D7052, #C18C5D)', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>

            <p className="text-center text-sm" style={{ color: '#8a7e76' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#5D7052', fontWeight: 600 }}>Sign in</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
