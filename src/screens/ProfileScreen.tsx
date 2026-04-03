import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { User, ShieldCheck, LogOut, Tv, DollarSign, Users, Tag, ChevronRight } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export const ProfileScreen = () => {
  const { profile, logout } = useUser();
  const [isEditingPublisher, setIsEditingPublisher] = useState(false);
  const [publisherData, setPublisherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPublisher = async () => {
      if (profile?.role === 'publisher') {
        const docRef = doc(db, 'publishers', profile.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPublisherData(docSnap.data());
        }
      }
    };
    fetchPublisher();
  }, [profile]);

  const handleSavePublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const data = {
        uid: profile.uid,
        channelName: publisherData?.channelName || '',
        niches: publisherData?.niches || [],
        audienceSize: Number(publisherData?.audienceSize) || 0,
        pricePerPost: Number(publisherData?.pricePerPost) || 0,
        isOnline: publisherData?.isOnline ?? true,
        isVerified: publisherData?.isVerified ?? false,
      };
      await setDoc(doc(db, 'publishers', profile.uid), data, { merge: true });
      setIsEditingPublisher(false);
      alert('Profile updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (isEditingPublisher) {
    return (
      <div className="p-4 min-h-screen bg-white">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setIsEditingPublisher(false)} className="p-2 -ml-2 text-gray-500">
            <ChevronRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-bold">TV Settings</h1>
        </header>

        <form onSubmit={handleSavePublisher} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Channel Name</label>
            <input
              type="text"
              required
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
              value={publisherData?.channelName || ''}
              onChange={(e) => setPublisherData({ ...publisherData, channelName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Audience Size (Avg. Views)</label>
            <div className="relative">
              <input
                type="number"
                required
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
                value={publisherData?.audienceSize || ''}
                onChange={(e) => setPublisherData({ ...publisherData, audienceSize: e.target.value })}
              />
              <Users className="absolute right-4 top-4 text-gray-400" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Price Per Post (₦)</label>
            <div className="relative">
              <input
                type="number"
                required
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
                value={publisherData?.pricePerPost || ''}
                onChange={(e) => setPublisherData({ ...publisherData, pricePerPost: e.target.value })}
              />
              <DollarSign className="absolute right-4 top-4 text-gray-400" size={20} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-100 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex flex-col items-center py-8">
        <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden shadow-inner">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
              {profile?.name[0]}
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 capitalize px-3 py-1 bg-gray-100 rounded-full font-medium">
            {profile?.role}
          </span>
          {publisherData?.isVerified && (
            <span className="text-[10px] text-white bg-blue-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck size={10} /> Verified
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mt-4">Account</h3>
        
        <button className="w-full text-left p-4 bg-white rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <User size={20} />
            </div>
            <span className="font-bold text-gray-700">Personal Info</span>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400" />
        </button>

        {profile?.role === 'publisher' && (
          <button 
            onClick={() => setIsEditingPublisher(true)}
            className="w-full text-left p-4 bg-white rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#25D366]">
                <Tv size={20} />
              </div>
              <span className="font-bold text-gray-700">TV Settings</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400" />
          </button>
        )}

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mt-6">Safety & Support</h3>

        <button className="w-full text-left p-4 bg-white rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
              <ShieldCheck size={20} />
            </div>
            <span className="font-bold text-gray-700">Security</span>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400" />
        </button>

        <button 
          onClick={logout}
          className="w-full text-left p-4 bg-white rounded-2xl flex items-center gap-3 font-bold text-red-500 mt-8 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <LogOut size={20} />
          </div>
          Logout
        </button>
      </div>
    </div>
  );
};
