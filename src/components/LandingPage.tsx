import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, TrendingUp, MessageSquare, Zap, Globe, Users, ArrowRight, Play, CheckCircle2, X, Mail, Lock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onGetStarted: () => void;
  onEmailSignUp: (email: string, pass: string) => Promise<void>;
  onEmailSignIn: (email: string, pass: string) => Promise<void>;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onEmailSignUp, onEmailSignIn }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authMode === 'signup') {
        await onEmailSignUp(email, password);
      } else {
        await onEmailSignIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#25D366] selection:text-black">
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X size={18} />
              </button>

              <div className="p-6 pt-10">
                <div className="text-center mb-6">
                  <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                    <ShieldCheck size={20} className="text-black" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                  </h2>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 focus:border-[#25D366] text-white rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all text-sm font-medium placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 focus:border-[#25D366] text-white rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all text-sm font-medium placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs font-medium">
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#25D366] text-black py-3.5 rounded-xl font-black text-base hover:bg-[#1ebe57] transition-all active:scale-95 disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Processing...' : (authMode === 'signup' ? 'Sign Up' : 'Sign In')}
                  </button>
                </form>

                <div className="mt-6">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <span className="relative px-3 bg-[#121212] text-[10px] font-black text-gray-500 uppercase tracking-widest">Or</span>
                  </div>

                  <button 
                    onClick={onGetStarted}
                    className="w-full bg-white/5 border border-white/10 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                    Google Account
                  </button>
                </div>

                <p className="text-center mt-6 text-xs text-gray-400">
                  {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button 
                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                    className="text-[#25D366] font-black hover:text-white transition-colors"
                  >
                    {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                <ShieldCheck size={24} className="text-black" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">ZapAds</span>
            </div>
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className="text-sm font-bold text-gray-400 hover:text-white transition-colors tracking-wide">Features</a>
              <a href="#how-it-works" className="text-sm font-bold text-gray-400 hover:text-white transition-colors tracking-wide">How it Works</a>
              <a href="/contact" className="text-sm font-bold text-gray-400 hover:text-white transition-colors tracking-wide">Contact</a>
            </div>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-all active:scale-95"
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block px-4 py-1.5 mb-8 text-xs font-bold tracking-widest uppercase bg-white/10 text-white border border-white/20 rounded-full backdrop-blur-md">
                The Future of WhatsApp Marketing
              </span>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-10 text-white">
                The Uber for <br />
                <span className="text-[#25D366] inline-block mt-2">WhatsApp TV.</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                Connect with thousands of verified WhatsApp TV publishers. Book, post, and track your ad campaigns in real-time with secure escrow payments.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto bg-[#25D366] text-black px-12 py-5 rounded-full font-black text-lg hover:bg-[#1ebe57] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(37,211,102,0.4)]"
                >
                  Get Started Now <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Atmospheric Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#25D366]/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 lg:py-48 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-10 leading-[0.9]">
                Everything you need to <br />
                <span className="text-[#25D366]">scale your reach.</span>
              </h2>
              <div className="space-y-10">
                {[
                  { 
                    icon: Zap, 
                    title: 'Instant Booking', 
                    desc: 'No more long negotiations. See a price you like? Book it in one tap.' 
                  },
                  { 
                    icon: ShieldCheck, 
                    title: 'Escrow Protection', 
                    desc: 'Your money is safe. We only release payments after the publisher uploads proof.' 
                  },
                  { 
                    icon: TrendingUp, 
                    title: 'Real-time Analytics', 
                    desc: 'Track your campaign status and engagement metrics from a single dashboard.' 
                  }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 text-gray-400 group-hover:text-[#25D366] group-hover:border-[#25D366]/50 transition-all">
                      <feature.icon size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-white">{feature.title}</h3>
                      <p className="text-gray-400 leading-relaxed text-lg">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="aspect-[4/5] bg-[#121212] rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative">
                <img 
                  src="https://picsum.photos/seed/whatsapp/1200/1500" 
                  alt="App Preview" 
                  className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                
                {/* Floating UI Elements */}
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="absolute top-16 -left-4 md:-left-12 bg-[#1A1A1A] p-5 rounded-3xl shadow-2xl border border-white/10 max-w-[240px] backdrop-blur-xl"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-black font-black text-sm">N</div>
                    <div>
                      <p className="text-sm font-bold text-white">Naija Tech TV</p>
                      <p className="text-xs text-gray-400">15k views • ₦5,000</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-[#25D366]"></div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="absolute bottom-16 -right-4 md:-right-12 bg-[#1A1A1A] p-5 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3 text-[#25D366] font-bold text-base">
                    <CheckCircle2 size={20} />
                    <span>Proof Verified</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Payment released to publisher</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-[#121212] border border-white/10 rounded-[4rem] p-16 lg:p-32 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
                Ready to dominate <br />
                WhatsApp Status?
              </h2>
              <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">
                Join 5,000+ advertisers and publishers already using ZapAds to grow their business.
              </p>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-white text-black px-14 py-6 rounded-full font-black text-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                Create Your Account
              </button>
            </div>
            {/* Decorative Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#25D366]/20 blur-[150px] -mr-48 -mt-48 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] -ml-48 -mb-48 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center">
                <ShieldCheck size={16} className="text-black" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">ZapAds</span>
            </div>
            <div className="flex gap-10 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-sm font-medium text-gray-600">© 2026 ZapAds. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
