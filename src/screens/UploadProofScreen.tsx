import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { ChevronLeft, Camera, ShieldCheck, Info, Upload } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export const UploadProofScreen = () => {
  const { adId } = useParams();
  const { profile } = useUser();
  const navigate = useNavigate();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Form state
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    const fetchAd = async () => {
      if (!adId) return;
      const docRef = doc(db, 'ads', adId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAd(docSnap.data());
      }
      setLoading(false);
    };
    fetchAd();
  }, [adId]);

  const handleSubmitProof = async () => {
    if (!profile || !ad || !proofUrl) return;
    setUploadLoading(true);
    try {
      await updateDoc(doc(db, 'ads', adId!), {
        status: 'posted',
        proofUrl: proofUrl,
      });
      
      // Create notification for advertiser
      await addDoc(collection(db, 'notifications'), {
        userId: ad.advertiserId,
        type: 'ad_posted',
        message: `The publisher has posted your ad and uploaded proof!`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      alert('Proof uploaded successfully! Payment will be released soon.');
      navigate('/inbox');
    } catch (err) {
      console.error(err);
      alert('Failed to upload proof. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading ad details...</div>;

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-4 flex items-center gap-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-lg">Upload Proof</h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-gray-50 p-4 rounded-2xl">
          <h2 className="font-bold text-gray-900 mb-2">Ad Details</h2>
          <p className="text-sm text-gray-600 italic">"{ad.caption}"</p>
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Budget</p>
              <p className="font-bold text-[#25D366]">{formatCurrency(ad.budget)}</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
              <p className="font-bold text-blue-600 capitalize">{ad.status}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Proof Screenshot URL</label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://example.com/proof-screenshot.jpg"
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
              <Camera className="absolute right-4 top-4 text-gray-400" size={20} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 px-1">Upload a screenshot of your WhatsApp status showing the ad views</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-2xl">
          <ShieldCheck className="text-[#25D366] shrink-0" size={20} />
          <p className="text-xs text-green-700 leading-relaxed">
            Once you upload proof, the advertiser will be notified. After their confirmation (or automatically after 24h), the payment will be released to your wallet.
          </p>
        </div>

        <button
          disabled={uploadLoading || !proofUrl}
          onClick={handleSubmitProof}
          className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
        >
          {uploadLoading ? 'Uploading...' : 'Submit Proof'}
        </button>
      </div>
    </div>
  );
};
