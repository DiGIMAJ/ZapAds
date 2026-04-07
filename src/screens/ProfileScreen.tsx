import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { User, ShieldCheck, LogOut, Tv, DollarSign, Users, Tag, ChevronRight, TrendingUp, Zap, Wallet } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const ProfileScreen = () => {
  const { profile, logout, activeRole, setActiveRole } = useUser();
  const navigate = useNavigate();
  const [isEditingPublisher, setIsEditingPublisher] = useState(false);
  const [isEditingAdvertiser, setIsEditingAdvertiser] = useState(false);
  const [formData, setFormData] = useState<any>(profile);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const publicRef = doc(db, 'public_profiles', profile.uid);
      
      const updateData = {
        ...formData,
        audienceSize: Number(formData.audienceSize) || 0,
        pricePerPost: Number(formData.pricePerPost) || 0,
      };
      
      await updateDoc(userRef, updateData);
      
      // Update public profile if user is publisher or both
      if (profile.role === 'publisher' || profile.role === 'both') {
        const publicData = {
          name: updateData.name,
          photoURL: updateData.photoURL || '',
          channelName: updateData.channelName || '',
          niches: updateData.niches || [],
          audienceSize: updateData.audienceSize || 0,
          pricePerPost: updateData.pricePerPost || 0,
        };
        await updateDoc(publicRef, publicData);
      }
      
      setIsEditingPublisher(false);
      setIsEditingAdvertiser(false);
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

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Channel Name</label>
            <input
              type="text"
              required
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
              value={formData?.channelName || ''}
              onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Audience Size (Avg. Views)</label>
            <div className="relative">
              <input
                type="number"
                required
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
                value={formData?.audienceSize || ''}
                onChange={(e) => setFormData({ ...formData, audienceSize: e.target.value })}
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
                value={formData?.pricePerPost || ''}
                onChange={(e) => setFormData({ ...formData, pricePerPost: e.target.value })}
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

  if (isEditingAdvertiser) {
    return (
      <div className="p-4 min-h-screen bg-white">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setIsEditingAdvertiser(false)} className="p-2 -ml-2 text-gray-500">
            <ChevronRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-bold">Brand Settings</h1>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Brand / Company Name</label>
            <input
              type="text"
              required
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
              value={formData?.brandName || ''}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
            />
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
    <div className="p-4 pb-24 bg-white min-h-screen">
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
            Role: {profile?.role}
          </span>
          {profile?.role === 'both' && (
            <span className="text-xs text-[#25D366] capitalize px-3 py-1 bg-green-50 rounded-full font-bold">
              Viewing as: {activeRole}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {profile?.role === 'both' && (
          <>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mt-4">Switch Dashboard</h3>
            <button 
              onClick={() => setActiveRole(activeRole === 'publisher' ? 'advertiser' : 'publisher')}
              className="w-full text-left p-4 bg-white rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all border-2 border-[#25D366]/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#25D366]">
                  <Zap size={20} />
                </div>
                <span className="font-bold text-gray-700">Switch to {activeRole === 'publisher' ? 'Advertiser' : 'Publisher'}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400" />
            </button>
          </>
        )}

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mt-4">Account Settings</h3>
        
        <button className="w-full text-left p-4 bg-white rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <User size={20} />
            </div>
            <span className="font-bold text-gray-700">Personal Info</span>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400" />
        </button>

        {(profile?.role === 'publisher' || profile?.role === 'both') && (
          <>
            <button 
              onClick={() => navigate('/wallet')}
              className="w-full text-left p-4 bg-white rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all border-2 border-green-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#25D366]">
                  <Wallet size={20} />
                </div>
                <span className="font-bold text-gray-700">Wallet & Payouts</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400" />
            </button>

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
          </>
        )}

        {(profile?.role === 'advertiser' || profile?.role === 'both') && (
          <button 
            onClick={() => setIsEditingAdvertiser(true)}
            className="w-full text-left p-4 bg-white rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                <TrendingUp size={20} />
              </div>
              <span className="font-bold text-gray-700">Brand Settings</span>
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
