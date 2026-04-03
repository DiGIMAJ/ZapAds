import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { Check, X, Clock, ExternalLink, Camera, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export const InboxScreen = () => {
  const { profile } = useUser();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'ads'), where('publisherId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(adsData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });
    return unsubscribe;
  }, [profile]);

  const handleStatusUpdate = async (adId: string, status: string, advertiserId: string) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { status });
      
      // Notify advertiser
      await addDoc(collection(db, 'notifications'), {
        userId: advertiserId,
        type: status === 'accepted' ? 'ad_accepted' : 'ad_declined',
        message: `Your ad request was ${status} by the publisher.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading requests...</div>;

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ad Requests</h1>
        <p className="text-gray-500 text-sm">Manage your incoming bookings</p>
      </header>

      {ads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Clock className="mx-auto text-gray-300 mb-2" size={48} />
          <p className="text-gray-500">No ad requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Ad Request</h4>
                    <p className="text-[10px] text-gray-400">{new Date(ad.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-1 rounded-full font-bold uppercase",
                  ad.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                  ad.status === 'accepted' ? "bg-blue-50 text-blue-600" :
                  ad.status === 'posted' ? "bg-green-50 text-green-600" :
                  "bg-gray-50 text-gray-400"
                )}>
                  {ad.status}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl mb-4">
                <p className="text-sm text-gray-700 line-clamp-2 italic">"{ad.caption}"</p>
                <div className="mt-2 flex gap-2">
                  <a href={ad.mediaUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#25D366] font-bold flex items-center gap-1">
                    View Media <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="font-bold text-gray-900">{formatCurrency(ad.budget)}</p>
                {ad.status === 'pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatusUpdate(ad.id, 'declined', ad.advertiserId)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(ad.id, 'accepted', ad.advertiserId)}
                      className="p-2 bg-[#25D366] text-white rounded-lg"
                    >
                      <Check size={20} />
                    </button>
                  </div>
                )}
                {ad.status === 'accepted' && (
                  <Link 
                    to={`/upload-proof/${ad.id}`}
                    className="bg-[#25D366] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    Post & Upload Proof <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
