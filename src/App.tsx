import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, getDocs, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Home, MessageSquare, PlusSquare, User, Bell, ShieldCheck, TrendingUp, ChevronLeft, CheckCircle2, Zap, Users, Search } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { BookingScreen } from './screens/BookingScreen';
import { InboxScreen } from './screens/InboxScreen';
import { CampaignsScreen } from './screens/CampaignsScreen';
import { UploadProofScreen } from './screens/UploadProofScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ContactScreen } from './screens/ContactScreen';

import { LandingPage } from './components/LandingPage';

// --- Types ---
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'publisher' | 'advertiser' | 'both' | 'admin';
  phone?: string;
  photoURL?: string;
  createdAt: string;
  // Ad Matching Fields
  channelName?: string;
  niches?: string[];
  audienceSize?: number;
  pricePerPost?: number;
  brandName?: string;
  targetNiches?: string[];
}

interface UserContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthReady: boolean;
  signUpEmail: (email: string, pass: string) => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  isCreatingProfile: boolean;
  setCreatingState: (val: boolean) => void;
  activeRole: 'publisher' | 'advertiser' | null;
  setActiveRole: (role: 'publisher' | 'advertiser') => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

// --- Components ---
const Navbar = () => {
  const { profile } = useUser();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/campaigns', icon: TrendingUp, label: 'Ads' },
    { path: '/inbox', icon: MessageSquare, label: 'Inbox' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors",
              isActive ? "text-[#25D366]" : "text-gray-500"
            )}
          >
            <item.icon size={24} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-[#25D366] border-t-transparent rounded-full"
    />
    <p className="mt-4 text-gray-900 font-black tracking-tight">ZapAds</p>
  </div>
);

// --- Screens ---
const AVAILABLE_NICHES = ['Tech', 'Entertainment', 'Sports', 'News', 'Fashion', 'Business', 'Lifestyle', 'Education'];

const RoleSelectionScreen = ({ onComplete }: { onComplete: () => void }) => {
  const { user, profile, setCreatingState } = useUser();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'publisher' | 'advertiser' | 'both' | null>(null);
  const [loading, setLoading] = useState(false);

  // If a profile somehow appears while we're on this screen, just trigger completion
  useEffect(() => {
    if (profile) {
      onComplete();
    }
  }, [profile, onComplete]);

  // Form State
  const [channelName, setChannelName] = useState('');
  const [audienceSize, setAudienceSize] = useState('');
  const [pricePerPost, setPricePerPost] = useState('');
  const [brandName, setBrandName] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [targetNiches, setTargetNiches] = useState<string[]>([]);

  const toggleNiche = (niche: string, type: 'publisher' | 'advertiser') => {
    if (type === 'publisher') {
      setSelectedNiches(prev => 
        prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
      );
    } else {
      setTargetNiches(prev => 
        prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
      );
    }
  };

  const handleComplete = async () => {
    if (!user || !role) return;
    setLoading(true);
    setCreatingState(true); // Lock the state immediately
    
    try {
      const newProfile: UserProfile = {
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email || '',
        role: role,
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        ...(role === 'publisher' ? {
          channelName,
          audienceSize: parseInt(audienceSize) || 0,
          pricePerPost: parseInt(pricePerPost) || 0,
          niches: selectedNiches
        } : role === 'advertiser' ? {
          brandName,
          targetNiches: targetNiches
        } : {
          // Both
          channelName,
          audienceSize: parseInt(audienceSize) || 0,
          pricePerPost: parseInt(pricePerPost) || 0,
          niches: selectedNiches,
          brandName,
          targetNiches: targetNiches
        })
      };
      
      onComplete(); 
      await setDoc(doc(db, 'users', user.uid), newProfile);

      // Create public profile for discovery if user is a publisher or both
      if (role === 'publisher' || role === 'both') {
        const publicProfile = {
          uid: user.uid,
          name: newProfile.name,
          photoURL: newProfile.photoURL || '',
          role: role,
          channelName: newProfile.channelName || '',
          niches: newProfile.niches || [],
          audienceSize: newProfile.audienceSize || 0,
          pricePerPost: newProfile.pricePerPost || 0,
          isOnline: true,
          isVerified: false,
          rating: 4.5,
          reviewCount: 0,
          createdAt: newProfile.createdAt
        };
        await setDoc(doc(db, 'public_profiles', user.uid), publicProfile);
      }
    } catch (err) {
      console.error("Setup error:", err);
      setCreatingState(false); // Unlock on error so user can try again
    } finally {
      setLoading(false);
    }
  };

  const isStep2Valid = () => {
    if (role === 'publisher') return channelName && audienceSize && pricePerPost && selectedNiches.length > 0;
    if (role === 'advertiser') return brandName && targetNiches.length > 0;
    if (role === 'both') {
      if (step === 2) return channelName && audienceSize && pricePerPost && selectedNiches.length > 0;
      if (step === 3) return brandName && targetNiches.length > 0;
    }
    return false;
  };

  const handleNext = () => {
    if (role === 'both' && step === 2) {
      setStep(3);
    } else {
      handleComplete();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col font-sans">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-3xl font-black text-gray-900 mt-12 mb-2 tracking-tight">Choose your role</h2>
            <p className="text-gray-500 mb-8 font-medium">How do you want to use ZapAds?</p>

            <div className="space-y-4 flex-1">
              <button
                onClick={() => setRole('advertiser')}
                className={cn(
                  "w-full p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden",
                  role === 'advertiser' ? "border-[#25D366] bg-green-50 shadow-lg shadow-green-100" : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                {role === 'advertiser' && <CheckCircle2 className="absolute top-6 right-6 text-[#25D366]" size={24} />}
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors", role === 'advertiser' ? "bg-[#25D366] text-white" : "bg-gray-100 text-gray-400")}>
                  <TrendingUp size={28} />
                </div>
                <h3 className="font-black text-xl text-gray-900">I'm an Advertiser</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">I want to book ads on WhatsApp TVs</p>
              </button>

              <button
                onClick={() => setRole('publisher')}
                className={cn(
                  "w-full p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden",
                  role === 'publisher' ? "border-[#25D366] bg-green-50 shadow-lg shadow-green-100" : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                {role === 'publisher' && <CheckCircle2 className="absolute top-6 right-6 text-[#25D366]" size={24} />}
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors", role === 'publisher' ? "bg-[#25D366] text-white" : "bg-gray-100 text-gray-400")}>
                  <MessageSquare size={28} />
                </div>
                <h3 className="font-black text-xl text-gray-900">I'm a Publisher</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">I own a WhatsApp TV and want to sell ad space</p>
              </button>

              <button
                onClick={() => setRole('both')}
                className={cn(
                  "w-full p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden",
                  role === 'both' ? "border-[#25D366] bg-green-50 shadow-lg shadow-green-100" : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                {role === 'both' && <CheckCircle2 className="absolute top-6 right-6 text-[#25D366]" size={24} />}
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors", role === 'both' ? "bg-[#25D366] text-white" : "bg-gray-100 text-gray-400")}>
                  <Zap size={28} />
                </div>
                <h3 className="font-black text-xl text-gray-900">I'm Both</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">I want to book ads and sell ad space</p>
              </button>
            </div>

            <button
              disabled={!role}
              onClick={() => setStep(2)}
              className="w-full bg-[#25D366] text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-green-100 disabled:opacity-50 mt-8 active:scale-95 transition-all"
            >
              Continue
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key={step === 2 ? "step2" : "step3"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            <button onClick={() => setStep(prev => prev - 1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 mt-4">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              {step === 2 ? (role === 'advertiser' ? 'Setup your Brand' : 'Setup your TV') : 'Setup your Brand'}
            </h2>
            <p className="text-gray-500 mb-8 font-medium">This helps us match you with the best opportunities.</p>

            <div className="space-y-6 flex-1">
              {(step === 2 && (role === 'publisher' || role === 'both')) ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">WhatsApp TV Name</label>
                    <input 
                      type="text" 
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="e.g. Naija Tech TV"
                      className="w-full bg-white border-2 border-gray-100 focus:border-[#25D366] rounded-2xl p-4 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Avg Views</label>
                      <input 
                        type="number" 
                        value={audienceSize}
                        onChange={(e) => setAudienceSize(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full bg-white border-2 border-gray-100 focus:border-[#25D366] rounded-2xl p-4 outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Price / Post (₦)</label>
                      <input 
                        type="number" 
                        value={pricePerPost}
                        onChange={(e) => setPricePerPost(e.target.value)}
                        placeholder="e.g. 2000"
                        className="w-full bg-white border-2 border-gray-100 focus:border-[#25D366] rounded-2xl p-4 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Your Niches</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_NICHES.map(niche => (
                        <button
                          key={niche}
                          onClick={() => toggleNiche(niche, 'publisher')}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all border-2",
                            selectedNiches.includes(niche) 
                              ? "bg-[#25D366] text-white border-[#25D366] shadow-md shadow-green-100" 
                              : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                          )}
                        >
                          {niche}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Brand / Company Name</label>
                    <input 
                      type="text" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Zap Sneakers"
                      className="w-full bg-white border-2 border-gray-100 focus:border-[#25D366] rounded-2xl p-4 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Target Niches</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_NICHES.map(niche => (
                        <button
                          key={niche}
                          onClick={() => toggleNiche(niche, 'advertiser')}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold transition-all border-2",
                            targetNiches.includes(niche) 
                              ? "bg-[#25D366] text-white border-[#25D366] shadow-md shadow-green-100" 
                              : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                          )}
                        >
                          {niche}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              disabled={loading || !isStep2Valid()}
              onClick={handleNext}
              className="w-full bg-[#25D366] text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-green-100 disabled:opacity-50 mt-8 active:scale-95 transition-all"
            >
              {loading ? 'Creating Account...' : (role === 'both' && step === 2 ? 'Next: Setup Brand' : 'Complete Setup')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeRole, setActiveRole] = useState<'publisher' | 'advertiser' | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(() => {
    return sessionStorage.getItem('zapads_creating_profile') === 'true';
  });
  const creatingRef = React.useRef(isCreatingProfile);
  const profileRef = React.useRef<UserProfile | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.role === 'both') {
        if (!activeRole) setActiveRole('advertiser');
      } else if (profile.role !== 'admin') {
        setActiveRole(profile.role as 'publisher' | 'advertiser');
      }
    }
  }, [profile]);

  const setCreatingState = (val: boolean) => {
    creatingRef.current = val;
    setIsCreatingProfile(val);
    if (val) {
      sessionStorage.setItem('zapads_creating_profile', 'true');
    } else {
      sessionStorage.removeItem('zapads_creating_profile');
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            profileRef.current = data;
            setProfile(data);
            setCreatingState(false);
          } else {
            // Only clear profile if we aren't currently in the middle of creating one
            // AND we don't already have a profile in memory (prevents flicker)
            if (!creatingRef.current && !profileRef.current) {
              setProfile(null);
            }
          }
          setLoading(false);
          setIsAuthReady(true);
        }, (error) => {
          console.error("Profile snapshot error", error);
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        profileRef.current = null;
        setProfile(null);
        setCreatingState(false);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    // Safety timeout for loading screen
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error", error);
    }
  };

  const signUpEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Sign up error", error);
      throw error;
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Sign in error", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Safety unlock for creating state
  useEffect(() => {
    if (isCreatingProfile) {
      const timer = setTimeout(() => {
        setCreatingState(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isCreatingProfile]);

  const handleProfileCreated = () => {
    setCreatingState(true);
  };

  if (loading) return <LoadingScreen />;

  const contextValue: UserContextType = { 
    user, 
    profile, 
    loading, 
    signIn, 
    logout, 
    isAuthReady, 
    signUpEmail, 
    signInEmail,
    isCreatingProfile,
    setCreatingState,
    activeRole,
    setActiveRole
  };

  if (!user) return (
    <UserContext.Provider value={contextValue}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage onGetStarted={signIn} onEmailSignUp={signUpEmail} onEmailSignIn={signInEmail} />} />
          <Route path="/contact" element={<ContactScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );

  // PRIORITY 1: If we have a profile, show the dashboard immediately
  if (profile) return (
    <UserContext.Provider value={contextValue}>
      <Router>
        <div className="min-h-screen bg-white pb-20 font-sans relative">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/campaigns" element={<CampaignsScreen />} />
            <Route path="/inbox" element={<InboxScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/book/:publisherId" element={<BookingScreen />} />
            <Route path="/upload-proof/:adId" element={<UploadProofScreen />} />
            <Route path="/create-ad" element={<CreateAdScreen />} />
            <Route path="/contact" element={<ContactScreen />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Navbar />
          
          {/* Floating WhatsApp Button */}
          <a 
            href="https://wa.me/23481588562?text=Hello%20ZapAds%20Support,%20I%20need%20help%20with..."
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-200 z-[60] active:scale-90 transition-transform"
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        </div>
      </Router>
    </UserContext.Provider>
  );
  
  // PRIORITY 2: If we are in the middle of creating a profile, show loading
  if (isCreatingProfile) return <LoadingScreen />;

  // PRIORITY 3: If no profile exists and we aren't creating one, show role selection
  return (
    <UserContext.Provider value={contextValue}>
      <RoleSelectionScreen onComplete={handleProfileCreated} />
    </UserContext.Provider>
  );
}

// --- Screen Implementations ---

const HomeScreen = () => {
  const { profile, activeRole, setActiveRole } = useUser();
  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hello, {profile?.name.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm font-medium">Ready to grow your reach?</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.role === 'both' && (
            <button 
              onClick={() => setActiveRole(activeRole === 'publisher' ? 'advertiser' : 'publisher')}
              className="bg-white border-2 border-gray-100 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-[#25D366] shadow-sm active:scale-95 transition-all"
            >
              Switch to {activeRole === 'publisher' ? 'Advertiser' : 'Publisher'}
            </button>
          )}
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <Bell className="text-gray-600" size={20} />
            </div>
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-gray-50 rounded-full"></span>
          </div>
        </div>
      </header>

      {activeRole === 'advertiser' ? <AdvertiserHome /> : <PublisherHome />}
    </div>
  );
};

const AdvertiserHome = () => {
  const { profile } = useUser();
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterNiche, setSelectedFilterNiche] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'audience'>('recommended');

  useEffect(() => {
    const fetchPublishers = async () => {
      try {
        const q = query(collection(db, 'public_profiles'), where('role', 'in', ['publisher', 'both']));
        const querySnapshot = await getDocs(q);
        let fetchedPubs: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPubs.push({ id: doc.id, ...doc.data() });
        });

        // Ad Matching Logic: Sort publishers by matching niches
        if (profile?.targetNiches && profile.targetNiches.length > 0) {
          fetchedPubs.sort((a, b) => {
            const aMatches = a.niches?.filter((n: string) => profile.targetNiches?.includes(n)).length || 0;
            const bMatches = b.niches?.filter((n: string) => profile.targetNiches?.includes(n)).length || 0;
            return bMatches - aMatches; // Sort descending by number of matches
          });
        }

        // If no publishers in DB, use mock data for preview purposes
        if (fetchedPubs.length === 0) {
          fetchedPubs = [
            { id: '1', channelName: 'Naija Tech TV', niches: ['Tech', 'News'], audienceSize: 15000, pricePerPost: 5000, rating: 4.8, isOnline: true },
            { id: '2', channelName: 'Gossip Mill', niches: ['Entertainment'], audienceSize: 50000, pricePerPost: 15000, rating: 4.5, isOnline: true },
            { id: '3', channelName: 'Sports Hub', niches: ['Sports'], audienceSize: 8000, pricePerPost: 3000, rating: 4.2, isOnline: false },
            { id: '4', channelName: 'Fashion Forward', niches: ['Fashion', 'Lifestyle'], audienceSize: 12000, pricePerPost: 4500, rating: 4.7, isOnline: true },
            { id: '5', channelName: 'Business Daily', niches: ['Business', 'News'], audienceSize: 25000, pricePerPost: 8000, rating: 4.9, isOnline: true },
          ];
        }

        setPublishers(fetchedPubs);
      } catch (error) {
        console.error("Error fetching publishers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishers();
  }, [profile]);

  const filteredPublishers = publishers.filter(pub => {
    const matchesSearch = pub.channelName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         pub.niches?.some((n: string) => n.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesNiche = !selectedFilterNiche || pub.niches?.includes(selectedFilterNiche);
    return matchesSearch && matchesNiche;
  });

  const sortedPublishers = [...filteredPublishers].sort((a, b) => {
    if (sortBy === 'price-asc') return (a.pricePerPost || 0) - (b.pricePerPost || 0);
    if (sortBy === 'price-desc') return (b.pricePerPost || 0) - (a.pricePerPost || 0);
    if (sortBy === 'audience') return (b.audienceSize || 0) - (a.audienceSize || 0);
    
    // Default: Recommended (already sorted by niche match in useEffect, but we can re-verify here)
    const aMatches = a.niches?.filter((n: string) => profile?.targetNiches?.includes(n)).length || 0;
    const bMatches = b.niches?.filter((n: string) => profile?.targetNiches?.includes(n)).length || 0;
    return bMatches - aMatches;
  });

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-gray-400 group-focus-within:text-[#25D366] transition-colors" size={20} />
        </div>
        <input 
          type="text"
          placeholder="Search TVs by name or niche..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border-2 border-gray-100 focus:border-[#25D366] rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium shadow-sm"
        />
      </div>

      {/* Niche Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setSelectedFilterNiche(null)}
          className={cn(
            "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border-2",
            selectedFilterNiche === null 
              ? "bg-[#25D366] text-white border-[#25D366] shadow-md shadow-green-100" 
              : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
          )}
        >
          All TVs
        </button>
        {AVAILABLE_NICHES.map(niche => (
          <button
            key={niche}
            onClick={() => setSelectedFilterNiche(niche)}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border-2",
              selectedFilterNiche === niche 
                ? "bg-[#25D366] text-white border-[#25D366] shadow-md shadow-green-100" 
                : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
            )}
          >
            {niche}
          </button>
        ))}
      </div>

      <div className="bg-[#25D366] p-8 rounded-[2rem] text-white shadow-xl shadow-green-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-2 tracking-tight">Book an Ad</h2>
          <p className="text-sm font-medium opacity-90 mb-6 max-w-[200px]">Reach thousands of active status viewers instantly.</p>
          <Link to="/create-ad" className="bg-white text-black px-6 py-3 rounded-full font-black text-sm inline-block shadow-lg hover:bg-gray-50 transition-colors">
            Create Campaign
          </Link>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-black text-xl text-gray-900 tracking-tight">Recommended for You</h3>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm font-bold text-[#25D366] bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
          >
            <option value="recommended">Sort: Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="audience">Audience: Largest</option>
          </select>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500 font-medium">Loading publishers...</div>
        ) : sortedPublishers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">No publishers found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPublishers.map((pub) => {
              // Calculate match percentage if target niches exist
              let matchPercentage = 0;
              if (profile?.targetNiches && profile.targetNiches.length > 0 && pub.niches) {
                const matches = pub.niches.filter((n: string) => profile.targetNiches?.includes(n)).length;
                matchPercentage = Math.round((matches / profile.targetNiches.length) * 100);
              }

              return (
                <Link key={pub.id} to={`/book/${pub.id}`} className="block bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-[#25D366] font-black text-2xl">
                        {pub.channelName ? pub.channelName[0] : 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-gray-900 text-lg">{pub.channelName || 'Unknown TV'}</h4>
                          {pub.isOnline && <span className="w-2.5 h-2.5 bg-[#25D366] rounded-full border-2 border-white"></span>}
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-1">{pub.niches?.join(', ') || 'General'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-gray-900">₦{(pub.pricePerPost || 0).toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">per post</p>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-5 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{(pub.audienceSize || 0).toLocaleString()}</span>
                      </div>
                      {matchPercentage > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Zap size={14} className="text-[#25D366]" />
                          <span className="text-xs font-bold text-[#25D366]">{matchPercentage}% Match</span>
                        </div>
                      )}
                    </div>
                    <span className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold text-xs">Book Now</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const PublisherHome = () => {
  const { profile } = useUser();
  const [isOnline, setIsOnline] = useState(profile?.isOnline ?? true);
  const [loading, setLoading] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !withdrawAmount) return;
    
    const amount = Number(withdrawAmount);
    if (amount < 1000) {
      alert('Minimum withdrawal is ₦1,000');
      return;
    }

    setWithdrawLoading(true);
    try {
      // 1. Log request to Firestore
      await addDoc(collection(db, 'withdrawals'), {
        userId: profile.uid,
        amount,
        bankCode,
        accountNumber,
        status: 'processing',
        createdAt: new Date().toISOString(),
      });
      
      // 2. Call Paystack Transfer API via our backend
      const res = await fetch('/api/paystack/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          bankCode,
          accountNumber,
          userId: profile.uid
        })
      });
      const data = await res.json();

      if (data.status) {
        alert('Withdrawal successful! Funds are on their way.');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
      } else {
        alert(`Withdrawal failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process withdrawal.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const newStatus = !isOnline;
      await updateDoc(doc(db, 'users', profile.uid), { isOnline: newStatus });
      await updateDoc(doc(db, 'public_profiles', profile.uid), { isOnline: newStatus });
      setIsOnline(newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={cn(
        "p-8 rounded-[2rem] text-white shadow-xl transition-colors relative overflow-hidden",
        isOnline ? "bg-[#25D366] shadow-green-100" : "bg-gray-900 shadow-gray-200"
      )}>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Status: {isOnline ? 'Online' : 'Offline'}</h2>
              <p className="text-sm font-medium opacity-90 mt-1">
                {isOnline ? 'You are visible to advertisers' : 'Advertisers cannot see you'}
              </p>
            </div>
            <button 
              onClick={toggleStatus}
              disabled={loading}
              className="bg-white text-black p-3 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              <PlusSquare size={24} className={isOnline ? "text-[#25D366]" : "text-gray-400"} />
            </button>
          </div>
          <div className="flex gap-4 mt-8">
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Today's Earnings</p>
              <p className="text-2xl font-black">₦0.00</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Pending Ads</p>
              <p className="text-2xl font-black">0</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      </div>

      <div className="bg-[#25D366] p-8 rounded-[2rem] text-white shadow-xl shadow-green-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-2 tracking-tight">Withdraw Funds</h2>
          <p className="text-sm font-medium opacity-90 mb-6 max-w-[200px]">Transfer your earnings to your bank account instantly.</p>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white text-black px-6 py-3 rounded-full font-black text-sm inline-block shadow-lg hover:bg-gray-50 transition-colors"
          >
            Withdraw Now
          </button>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div>
        <h3 className="font-black text-xl text-gray-900 mb-4 px-1 tracking-tight">Recent Ad Requests</h3>
        <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-gray-400" size={28} />
          </div>
          <p className="text-gray-500 font-medium">No active requests yet.</p>
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-2">Withdraw Funds</h2>
              <p className="text-sm text-gray-500 mb-6 font-medium">Transfer your earnings to your local bank account via Paystack.</p>
              
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Amount (₦)</label>
                  <input 
                    type="number"
                    required
                    min="1000"
                    placeholder="Min 1,000"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366] font-bold"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Bank Name</label>
                  <select 
                    required
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366] font-bold appearance-none"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                  >
                    <option value="">Select Bank</option>
                    <option value="011">First Bank</option>
                    <option value="058">GTBank</option>
                    <option value="033">United Bank for Africa</option>
                    <option value="044">Access Bank</option>
                    <option value="057">Zenith Bank</option>
                    <option value="035">Wema Bank</option>
                    <option value="070">Fidelity Bank</option>
                    <option value="214">First City Monument Bank</option>
                    <option value="032">Union Bank</option>
                    <option value="030">Heritage Bank</option>
                    <option value="082">Keystone Bank</option>
                    <option value="076">Polaris Bank</option>
                    <option value="221">Stanbic IBTC Bank</option>
                    <option value="232">Sterling Bank</option>
                    <option value="101">Providus Bank</option>
                    <option value="090110">VFD Microfinance Bank</option>
                    <option value="090267">Kuda Bank</option>
                    <option value="090405">Moniepoint MFB</option>
                    <option value="090175">Opay</option>
                    <option value="090267">Palmpay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Account Number</label>
                  <input 
                    type="text"
                    required
                    maxLength={10}
                    placeholder="10 digits"
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366] font-bold"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={withdrawLoading}
                  className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-100 active:scale-95 transition-all disabled:opacity-50 mt-4"
                >
                  {withdrawLoading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-full py-3 text-gray-400 font-bold text-sm"
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CreateAdScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="p-4 min-h-screen bg-white font-sans">
      <header className="flex items-center gap-4 mb-8 pt-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-tight">Create Campaign</h1>
      </header>
      
      <div className="bg-white p-8 rounded-[2rem] text-center border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <PlusSquare className="text-[#25D366]" size={36} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Ready to reach more people?</h2>
        <p className="text-gray-500 mb-8 font-medium leading-relaxed">Create your ad content and then choose from our top-rated publishers.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-100 active:scale-95 transition-all"
        >
          Browse Publishers
        </button>
      </div>
      
      <div className="mt-8 space-y-4">
        <h3 className="font-black text-lg text-gray-900 px-1">Campaign Tips</h3>
        <div className="bg-white p-5 rounded-[2rem] flex gap-4 border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck className="text-[#25D366]" size={24} />
          </div>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Use high-quality images with clear text. WhatsApp status viewers usually spend 2-5 seconds per slide.
          </p>
        </div>
      </div>
    </div>
  );
};
