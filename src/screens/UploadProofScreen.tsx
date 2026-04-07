import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { ChevronLeft, Camera, ShieldCheck, Info, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { uploadToCloudinary } from '../lib/cloudinary';

export const UploadProofScreen = () => {
  const { adId } = useParams();
  const { profile } = useUser();
  const navigate = useNavigate();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);

  // Form state
  const [proofUrl, setProofUrl] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setProofUrl(url);
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
    } finally {
      setFileUploading(false);
    }
  };

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
            <label className="block text-sm font-bold text-gray-700 mb-2">Proof Screenshot</label>
            <div className="space-y-4">
              {proofUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
                  <img src={proofUrl} alt="Proof Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => setProofUrl('')}
                    className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm text-red-500"
                  >
                    <Upload size={16} className="rotate-180" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {fileUploading ? (
                      <Loader2 className="w-10 h-10 text-[#25D366] animate-spin mb-3" />
                    ) : (
                      <Camera className="w-10 h-10 text-gray-400 mb-3" />
                    )}
                    <p className="mb-2 text-sm text-gray-500 font-bold">
                      {fileUploading ? 'Uploading...' : 'Click to upload screenshot'}
                    </p>
                    <p className="text-xs text-gray-400">PNG or JPG of your status views</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={fileUploading} />
                </label>
              )}
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Or paste screenshot URL here..."
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366] text-sm"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                />
              </div>
            </div>
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
