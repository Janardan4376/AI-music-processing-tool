import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music2, Loader2, Mic2, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="bg-animated" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel flex overflow-hidden relative z-10"
        style={{ width: '100%', maxWidth: '1000px', minHeight: '600px', display: 'flex' }}
      >
        {/* Left Side - Visuals */}
        <div className="hidden-mobile" style={{ width: '50%', background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,41,59,0.8))', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'url("https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2070&auto=format&fit=crop") center/cover', opacity: 0.2, mixBlendMode: 'overlay' }} />
          
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10"
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)' }}>
              <Music2 color="white" size={24} />
            </div>
            <h1 style={{ marginBottom: '0.5rem' }}>ByteCipher Studio</h1>
            <p style={{ fontSize: '1.1rem' }}>AI-powered vocal separation.</p>
          </motion.div>

          <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex items-center gap-md">
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic2 size={20} color="#c084fc" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>Studio Quality</h3>
                <p className="text-sm">Professional results</p>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#f472b6" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>Smart Lyrics</h3>
                <p className="text-sm">Auto-synced display</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div style={{ width: '100%', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 style={{ marginBottom: '0.5rem' }}>
                {isLogin ? 'Welcome' : 'Join'}
              </h2>
              <p style={{ marginBottom: '2rem' }}>
                {isLogin ? 'Access your studio.' : 'Start your journey.'}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}
                  >
                    {error}
                  </motion.div>
                )}
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full"
                  style={{ marginTop: '1rem' }}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      {isLogin ? 'Sign In' : 'Get Started'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center" style={{ marginTop: '2rem' }}>
                <p className="text-sm">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ marginLeft: '0.5rem', color: '#c084fc', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isLogin ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
