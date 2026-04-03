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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#25D366] selection:text-white">
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8 pt-12">
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-[#25D366] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-100">
                    <ShieldCheck size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-2">
                    {authMode === 'signup' 
                      ? 'Join the WhatsApp TV marketplace' 
                      : 'Sign in to manage your ads'}
                  </p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#25D366] focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#25D366] focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl text-sm font-medium">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:bg-[#1ebe57] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : (authMode === 'signup' ? 'Sign Up' : 'Sign In')}
                  </button>
                </form>

                <div className="mt-8">
                  <div className="relative flex items-center justify-center mb-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <span className="relative px-4 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
                  </div>

                  <button 
                    onClick={onGetStarted}
                    className="w-full bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    Google Account
                  </button>
                </div>

                <p className="text-center mt-8 text-sm text-gray-500">
                  {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button 
                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                    className="text-[#25D366] font-bold hover:underline"
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-gray-900">ZapAds</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-500 hover:text-[#25D366] transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-500 hover:text-[#25D366] transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-[#25D366] transition-colors">Pricing</a>
            </div>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-[#25D366] text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-green-100 hover:bg-[#1ebe57] transition-all active:scale-95"
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-green-50 text-[#25D366] rounded-full">
                The Future of WhatsApp Marketing
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-gray-900">
                The Uber for <br />
                <span className="text-[#25D366]">WhatsApp TV Ads.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Connect with thousands of verified WhatsApp TV publishers. Book, post, and track your ad campaigns in real-time with secure escrow payments.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto bg-[#25D366] text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-green-200 hover:bg-[#1ebe57] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Get Started Now <ArrowRight size={20} />
                </button>
                <button className="w-full sm:w-auto bg-white text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                  <Play size={20} fill="currentColor" /> Watch Demo
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-100/50 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active TVs', value: '2,500+' },
              { label: 'Daily Views', value: '1.2M+' },
              { label: 'Ads Posted', value: '45k+' },
              { label: 'Payouts', value: '₦150M+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 leading-tight">
                Everything you need to <br />
                <span className="text-[#25D366]">scale your reach.</span>
              </h2>
              <div className="space-y-8">
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
                  <div key={i} className="flex gap-6">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 text-[#25D366]">
                      <feature.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="aspect-square bg-gray-100 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <img 
                  src="https://picsum.photos/seed/whatsapp/1200/1200" 
                  alt="App Preview" 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent"></div>
                
                {/* Floating UI Elements */}
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  className="absolute top-12 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 max-w-[200px]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">N</div>
                    <div>
                      <p className="text-[10px] font-bold">Naija Tech TV</p>
                      <p className="text-[8px] text-gray-400">15k views • ₦5,000</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-[#25D366]"></div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute bottom-12 -right-8 bg-white p-4 rounded-2xl shadow-xl border border-gray-100"
                >
                  <div className="flex items-center gap-2 text-[#25D366] font-bold text-sm">
                    <CheckCircle2 size={16} />
                    <span>Proof Verified</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Payment released to publisher</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-[3rem] p-12 lg:p-24 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
                Ready to dominate <br />
                WhatsApp Status?
              </h2>
              <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
                Join 5,000+ advertisers and publishers already using ZapAds to grow their business.
              </p>
              <button 
                onClick={onGetStarted}
                className="bg-[#25D366] text-white px-12 py-6 rounded-2xl font-black text-xl shadow-2xl shadow-green-900/20 hover:bg-[#1ebe57] transition-all active:scale-95"
              >
                Create Your Account
              </button>
            </div>
            {/* Decorative Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#25D366]/10 blur-[120px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] -ml-48 -mb-48"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#25D366] rounded flex items-center justify-center">
                <ShieldCheck size={14} className="text-white" />
              </div>
              <span className="text-lg font-black tracking-tight">ZapAds</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-400">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
            <p className="text-sm text-gray-400">© 2026 ZapAds. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
