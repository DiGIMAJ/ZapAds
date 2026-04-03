import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Home, MessageSquare, PlusSquare, User, Bell, ShieldCheck, TrendingUp, ChevronLeft } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { BookingScreen } from './screens/BookingScreen';
import { InboxScreen } from './screens/InboxScreen';
import { CampaignsScreen } from './screens/CampaignsScreen';
import { UploadProofScreen } from './screens/UploadProofScreen';
import { ProfileScreen } from './screens/ProfileScreen';

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

// --- Screens (Placeholders for now) ---
const RoleSelectionScreen = () => {
  const { user } = useUser();
  const [role, setRole] = useState<'publisher' | 'advertiser' | null>(null);
  const [loading, setLoading] = useState(false);

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
      };
      await setDoc(doc(db, 'users', user.uid), profile);
      // No reload needed, onSnapshot will pick it up
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-2">Choose your role</h2>
      <p className="text-gray-600 mb-8">How do you want to use ZapAds?</p>

      <div className="space-y-4 flex-1">
        <button
          onClick={() => setRole('advertiser')}
          className={cn(
            "w-full p-6 rounded-2xl border-2 text-left transition-all",
            role === 'advertiser' ? "border-[#25D366] bg-green-50" : "border-gray-200 bg-white"
          )}
        >
          <TrendingUp className={cn(role === 'advertiser' ? "text-[#25D366]" : "text-gray-400")} />
          <h3 className="font-bold text-lg mt-4">I'm an Advertiser</h3>
          <p className="text-sm text-gray-500">I want to book ads on WhatsApp TVs</p>
        </button>

        <button
          onClick={() => setRole('publisher')}
          className={cn(
            "w-full p-6 rounded-2xl border-2 text-left transition-all",
            role === 'publisher' ? "border-[#25D366] bg-green-50" : "border-gray-200 bg-white"
          )}
        >
          <MessageSquare className={cn(role === 'publisher' ? "text-[#25D366]" : "text-gray-400")} />
          <h3 className="font-bold text-lg mt-4">I'm a Publisher</h3>
          <p className="text-sm text-gray-500">I own a WhatsApp TV and want to sell ad space</p>
        </button>
      </div>

      <button
        disabled={!role || loading}
        onClick={handleComplete}
        className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl shadow-md disabled:opacity-50 mt-8"
      >
        {loading ? 'Setting up...' : 'Continue'}
      </button>
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
        // Use onSnapshot for real-time profile updates
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
      <LandingPage 
        onGetStarted={signIn} 
        onEmailSignUp={signUpEmail}
        onEmailSignIn={signInEmail}
      />
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
        <div className="min-h-screen bg-gray-50 pb-20">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/campaigns" element={<CampaignsScreen />} />
            <Route path="/inbox" element={<InboxScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/book/:publisherId" element={<BookingScreen />} />
            <Route path="/upload-proof/:adId" element={<UploadProofScreen />} />
            <Route path="/create-ad" element={<CreateAdScreen />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Navbar />
        </div>
      </Router>
    </UserContext.Provider>
  );
}

// --- Screen Implementations ---
// These will be moved to separate files later

const HomeScreen = () => {
  const { profile } = useUser();
  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {profile?.name.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm">Ready to grow your reach?</p>
        </div>
        <div className="relative">
          <Bell className="text-gray-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>
      </header>

      {profile?.role === 'advertiser' ? <AdvertiserHome /> : <PublisherHome />}
    </div>
  );
};

const AdvertiserHome = () => {
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch from Firestore
    // For now, let's mock some data to show the UI
    const mockPublishers = [
      { id: '1', channelName: 'Naija Tech TV', niches: ['Tech', 'News'], audienceSize: 15000, pricePerPost: 5000, rating: 4.8, isOnline: true },
      { id: '2', channelName: 'Gossip Mill', niches: ['Entertainment'], audienceSize: 50000, pricePerPost: 15000, rating: 4.5, isOnline: true },
      { id: '3', channelName: 'Sports Hub', niches: ['Sports'], audienceSize: 8000, pricePerPost: 3000, rating: 4.2, isOnline: false },
    ];
    setPublishers(mockPublishers);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-[#25D366] p-6 rounded-3xl text-white shadow-lg shadow-green-100">
        <h2 className="text-lg font-bold mb-1">Book an Ad</h2>
        <p className="text-sm opacity-90 mb-4">Reach thousands of active status viewers instantly.</p>
        <Link to="/create-ad" className="bg-white text-[#25D366] px-6 py-2 rounded-full font-bold text-sm inline-block">
          Create Campaign
        </Link>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Available Publishers</h3>
          <button className="text-[#25D366] text-sm font-bold">See All</button>
        </div>
        <div className="space-y-4">
          {publishers.map((pub) => (
            <Link key={pub.id} to={`/book/${pub.id}`} className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-[#25D366] font-bold text-xl">
                    {pub.channelName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{pub.channelName}</h4>
                      {pub.isOnline && <span className="w-2 h-2 bg-[#25D366] rounded-full"></span>}
                    </div>
                    <p className="text-xs text-gray-500">{pub.niches.join(', ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#25D366]">₦{pub.pricePerPost.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">per post</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center text-xs">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <User size={12} className="text-gray-400" />
                    <span className="text-gray-600 font-medium">{pub.audienceSize.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-gray-600 font-medium">{pub.rating}</span>
                  </div>
                </div>
                <span className="bg-green-50 text-[#25D366] px-3 py-1 rounded-full font-bold">Book Now</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const PublisherHome = () => {
  const [isOnline, setIsOnline] = useState(true);
  return (
    <div className="space-y-6">
      <div className={cn(
        "p-6 rounded-3xl text-white shadow-lg transition-colors",
        isOnline ? "bg-[#25D366]" : "bg-gray-400"
      )}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold">Status: {isOnline ? 'Online' : 'Offline'}</h2>
            <p className="text-sm opacity-90">
              {isOnline ? 'You are visible to advertisers' : 'Advertisers cannot see you'}
            </p>
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className="bg-white text-gray-900 p-2 rounded-full"
          >
            <PlusSquare size={20} className={isOnline ? "text-[#25D366]" : "text-gray-400"} />
          </button>
        </div>
        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/20 p-3 rounded-2xl">
            <p className="text-xs opacity-80">Today's Earnings</p>
            <p className="text-xl font-bold">₦0.00</p>
          </div>
          <div className="flex-1 bg-white/20 p-3 rounded-2xl">
            <p className="text-xs opacity-80">Pending Ads</p>
            <p className="text-xl font-bold">0</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 mb-4">Recent Ad Requests</h3>
        <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-gray-300">
          <MessageSquare className="mx-auto text-gray-300 mb-2" size={32} />
          <p className="text-gray-500 text-sm">No active requests yet.</p>
        </div>
      </div>
    </div>
  );
};

const CreateAdScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="p-4 min-h-screen bg-white">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft />
        </button>
        <h1 className="text-xl font-bold">Create Campaign</h1>
      </header>
      
      <div className="bg-green-50 p-6 rounded-3xl text-center border-2 border-dashed border-[#25D366]">
        <PlusSquare className="mx-auto text-[#25D366] mb-4" size={48} />
        <h2 className="font-bold text-gray-900 mb-2">Ready to reach more people?</h2>
        <p className="text-sm text-gray-600 mb-6">Create your ad content and then choose from our top-rated publishers.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#25D366] text-white px-8 py-3 rounded-2xl font-bold shadow-md"
        >
          Browse Publishers
        </button>
      </div>
      
      <div className="mt-12 space-y-4">
        <h3 className="font-bold text-gray-900 px-1">Campaign Tips</h3>
        <div className="bg-gray-50 p-4 rounded-2xl flex gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="text-[#25D366]" size={20} />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Use high-quality images with clear text. WhatsApp status viewers usually spend 2-5 seconds per slide.
          </p>
        </div>
      </div>
    </div>
  );
};
