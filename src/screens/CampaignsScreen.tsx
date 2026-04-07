import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { TrendingUp, Clock, CheckCircle, XCircle, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

export const CampaignsScreen = () => {
  const { profile } = useUser();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  const handleVerify = async (ad: any) => {
    if (!window.confirm('Are you sure the ad was posted correctly? This will release funds to the publisher.')) return;
    
    setVerifying(ad.id);
    try {
      await updateDoc(doc(db, 'ads', ad.id), {
        status: 'completed'
      });

      // Notify publisher
      await addDoc(collection(db, 'notifications'), {
        userId: ad.publisherId,
        type: 'ad_completed',
        message: `Your proof for ad #${ad.id.slice(0, 5)} was verified! Funds have been added to your wallet.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      alert('Campaign completed successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to verify ad.');
    } finally {
      setVerifying(null);
    }
  };

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'ads'), where('advertiserId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(adsData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });
    return unsubscribe;
  }, [profile]);

  if (loading) return <div className="p-8 text-center">Loading campaigns...</div>;

  return (
    <div className="p-4 space-y-6 pb-24 bg-white min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Campaigns</h1>
        <p className="text-gray-500 text-sm">Track your ad performance</p>
      </header>

      {ads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <TrendingUp className="mx-auto text-gray-300 mb-2" size={48} />
          <p className="text-gray-500">No campaigns yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Campaign #{ad.id.slice(0, 5)}</h4>
                    <p className="text-[10px] text-gray-400">{new Date(ad.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-1 rounded-full font-bold uppercase",
                  ad.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                  ad.status === 'accepted' ? "bg-blue-50 text-blue-600" :
                  ad.status === 'posted' ? "bg-green-50 text-green-600" :
                  ad.status === 'completed' ? "bg-green-100 text-green-700" :
                  "bg-gray-50 text-gray-400"
                )}>
                  {ad.status}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl mb-4">
                <p className="text-sm text-gray-700 line-clamp-2 italic">"{ad.caption}"</p>
                <div className="mt-2 flex gap-2">
                  <a href={ad.mediaUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#25D366] font-bold flex items-center gap-1">
                    View Ad Media <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {ad.proofUrl && ad.status === 'posted' && (
                <div className="mb-4 p-4 bg-green-50 rounded-2xl border border-green-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-[#25D366]" size={16} />
                      <span className="text-xs font-bold text-green-700">Proof Uploaded</span>
                    </div>
                    <a href={ad.proofUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#25D366] font-bold underline">
                      View Proof
                    </a>
                  </div>
                  <button 
                    onClick={() => handleVerify(ad)}
                    disabled={verifying === ad.id}
                    className="w-full bg-[#25D366] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    {verifying === ad.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                    Verify & Release Funds
                  </button>
                </div>
              )}

              {ad.proofUrl && ad.status === 'completed' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-gray-400" size={16} />
                    <span className="text-xs font-bold text-gray-500">Campaign Completed</span>
                  </div>
                  <a href={ad.proofUrl} target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 font-bold underline">
                    View Proof
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <p className="font-bold text-gray-900">{formatCurrency(ad.budget)}</p>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock size={12} />
                  <span>{ad.status === 'pending' ? 'Waiting for publisher' : 'In progress'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
