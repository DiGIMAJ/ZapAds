import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Home, MessageSquare, PlusSquare, User, Bell, ShieldCheck, TrendingUp, ChevronLeft, CheckCircle2, Zap, Users } from 'lucide-react';
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
  role: 'publisher' | 'advertiser' | 'admin';
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
    <div className="w-16 h-16 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-gray-600 font-medium">Connecting to ZapAds...</p>
  </div>
);

// --- Screens ---
const AVAILABLE_NICHES = ['Tech', 'Entertainment', 'Sports', 'News', 'Fashion', 'Business', 'Lifestyle', 'Education'];

const RoleSelectionScreen = () => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'publisher' | 'advertiser' | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [channelName, setChannelName] = useState('');
  const [audienceSize, setAudienceSize] = useState('');
  const [pricePerPost, setPricePerPost] = useState('');
  const [brandName, setBrandName] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);

  const toggleNiche = (niche: string) => {
    setSelectedNiches(prev => 
      prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
    );
  };

  const handleComplete = async () => {
    if (!user || !role) return;
    setLoading(true);
    try {
      const profile: UserProfile = {
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
        } : {
          brandName,
          targetNiches: selectedNiches
        })
      };
      await setDoc(doc(db, 'users', user.uid), profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            <button onClick={() => setStep(1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 mt-4">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              {role === 'publisher' ? 'Setup your TV' : 'Setup your Brand'}
            </h2>
            <p className="text-gray-500 mb-8 font-medium">This helps us match you with the best opportunities.</p>

            <div className="space-y-6 flex-1">
              {role === 'publisher' ? (
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
                </>
              ) : (
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
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
                  {role === 'publisher' ? 'Your Niches' : 'Target Niches'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_NICHES.map(niche => (
                    <button
                      key={niche}
                      onClick={() => toggleNiche(niche)}
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
            </div>

            <button
              disabled={loading || (role === 'publisher' ? (!channelName || !audienceSize || !pricePerPost) : !brandName)}
              onClick={handleComplete}
              className="w-full bg-[#25D366] text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-green-100 disabled:opacity-50 mt-8 active:scale-95 transition-all"
            >
              {loading ? 'Creating Account...' : 'Complete Setup'}
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

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
          setIsAuthReady(true);
        }, (error) => {
          console.error("Profile snapshot error", error);
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
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

  if (loading) return <LoadingScreen />;

  if (!user) return (
    <UserContext.Provider value={{ user, profile, loading, signIn, logout, isAuthReady, signUpEmail, signInEmail }}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage onGetStarted={signIn} onEmailSignUp={signUpEmail} onEmailSignIn={signInEmail} />} />
          <Route path="/contact" element={<ContactScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );

  if (user && !profile) return (
    <UserContext.Provider value={{ user, profile, loading, signIn, logout, isAuthReady, signUpEmail, signInEmail }}>
      <RoleSelectionScreen />
    </UserContext.Provider>
  );

  return (
    <UserContext.Provider value={{ user, profile, loading, signIn, logout, isAuthReady, signUpEmail, signInEmail }}>
      <Router>
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
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
        </div>
      </Router>
    </UserContext.Provider>
  );
}

// --- Screen Implementations ---

const HomeScreen = () => {
  const { profile } = useUser();
  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hello, {profile?.name.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm font-medium">Ready to grow your reach?</p>
        </div>
        <div className="relative">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
            <Bell className="text-gray-600" size={20} />
          </div>
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-gray-50 rounded-full"></span>
        </div>
      </header>

      {profile?.role === 'advertiser' ? <AdvertiserHome /> : <PublisherHome />}
    </div>
  );
};

const AdvertiserHome = () => {
  const { profile } = useUser();
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublishers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'publisher'));
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

  return (
    <div className="space-y-8">
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
          <button className="text-[#25D366] text-sm font-bold">See All</button>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500 font-medium">Loading publishers...</div>
        ) : (
          <div className="space-y-4">
            {publishers.map((pub) => {
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
  const [isOnline, setIsOnline] = useState(true);
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
              onClick={() => setIsOnline(!isOnline)}
              className="bg-white text-black p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"
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

      <div>
        <h3 className="font-black text-xl text-gray-900 mb-4 px-1 tracking-tight">Recent Ad Requests</h3>
        <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-gray-400" size={28} />
          </div>
          <p className="text-gray-500 font-medium">No active requests yet.</p>
        </div>
      </div>
    </div>
  );
};

const CreateAdScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="p-4 min-h-screen bg-gray-50 font-sans">
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
