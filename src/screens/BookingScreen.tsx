import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { ChevronLeft, ShieldCheck, Info, Upload } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { usePaystackPayment } from 'react-paystack';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const BookingScreen = () => {
  const { publisherId } = useParams();
  const { profile } = useUser();
  const navigate = useNavigate();
  const [publisher, setPublisher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Form state
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    const fetchPublisher = async () => {
      if (!publisherId) return;
      const docRef = doc(db, 'public_profiles', publisherId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPublisher({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Mock for demo if not found
        setPublisher({
          uid: publisherId,
          channelName: 'Naija Tech TV',
          niches: ['Tech', 'News'],
          audienceSize: 15000,
          pricePerPost: 5000,
          rating: 4.8,
          isOnline: true
        });
      }
      setLoading(false);
    };
    fetchPublisher();
  }, [publisherId]);

  const totalAmount = publisher ? publisher.pricePerPost : 0;

  const config = {
    reference: (new Date()).getTime().toString(),
    email: profile?.email || '',
    amount: totalAmount * 100, // Paystack expects amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
  };

  useEffect(() => {
    if (config.publicKey === 'pk_test_placeholder') {
      console.warn("Paystack Public Key is missing! Please set VITE_PAYSTACK_PUBLIC_KEY in your environment variables.");
    }
  }, [config.publicKey]);

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {
    setBookingLoading(true);
    try {
      // Verify payment on backend
      const verifyRes = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.reference }),
      });

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        console.error(`Verification failed with status ${verifyRes.status}:`, errorText);
        alert(`Payment verification failed (Status ${verifyRes.status}). Please contact support.`);
        return;
      }

      const verifyData = await verifyRes.json();

      if (verifyData.status && verifyData.data.status === 'success') {
        const adRef = doc(collection(db, 'ads'));
        const adData = {
          id: adRef.id,
          advertiserId: profile?.uid || '',
          publisherId: publisher.uid || '',
          mediaUrl: mediaUrl || 'https://picsum.photos/seed/ad/800/600',
          caption: caption || 'No caption provided',
          niche: (publisher.niches && publisher.niches[0]) || 'General',
          budget: Number(publisher.pricePerPost) || 0,
          platformFee: Math.round((Number(publisher.pricePerPost) || 0) * 0.10),
          publisherEarnings: Math.round((Number(publisher.pricePerPost) || 0) * 0.90),
          status: 'paid',
          paymentReference: reference.reference,
          createdAt: new Date().toISOString(),
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
        };
        
        try {
          await setDoc(adRef, adData);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `ads/${adRef.id}`);
        }
        
        // Create notification for publisher
        const notifRef = doc(collection(db, 'notifications'));
        const notifData = {
          id: notifRef.id,
          userId: publisher.uid || '',
          type: 'ad_request',
          message: `${profile?.name || 'An advertiser'} has paid for an ad on your TV!`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(notifRef, notifData);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `notifications/${notifRef.id}`);
        }

        alert('Payment successful and ad booked!');
        navigate('/campaigns');
      } else {
        console.error("Verification failed:", verifyData);
        alert(`Payment verification failed: ${verifyData.message || verifyData.error || 'Unknown error'}. Please contact support.`);
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert('Error verifying payment. Please check your internet connection or contact support.');
    } finally {
      setBookingLoading(false);
    }
  };

  const onClose = () => {
    console.log('Payment closed');
  };

  const handleBook = () => {
    if (!profile || !publisher) return;
    if (!profile.email) {
      alert('Please add an email to your profile to make payments.');
      return;
    }
    initializePayment({ onSuccess, onClose });
  };

  if (loading) return <div className="p-8 text-center">Loading publisher...</div>;

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-4 flex items-center gap-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-lg">Book Ad</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Publisher Info */}
        <div className="bg-gray-50 p-4 rounded-2xl flex gap-4 items-center">
          <div className="w-16 h-16 bg-[#25D366] rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            {publisher.channelName ? publisher.channelName[0] : 'T'}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{publisher.channelName || 'Unknown TV'}</h2>
            <p className="text-sm text-gray-500">{(publisher.audienceSize || 0).toLocaleString()} status views</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-xs font-bold text-gray-600">{publisher.rating || '4.5'}</span>
            </div>
          </div>
        </div>

        {/* Ad Details Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Ad Media URL</label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
              <Upload className="absolute right-4 top-4 text-gray-400" size={20} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 px-1">Paste a link to your image or video</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Caption</label>
            <textarea
              placeholder="Write your ad caption here..."
              rows={4}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366] resize-none"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Schedule Date</label>
            <input
              type="datetime-local"
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#25D366]"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-green-50 p-6 rounded-3xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="text-xl font-black text-[#25D366]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl">
          <Info className="text-blue-500 shrink-0" size={20} />
          <p className="text-xs text-blue-700 leading-relaxed">
            Your payment will be held in <strong>Escrow</strong> and only released to the publisher after they upload proof of posting.
          </p>
        </div>

        <button
          disabled={bookingLoading}
          onClick={handleBook}
          className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
        >
          {bookingLoading ? 'Processing...' : `Pay ${formatCurrency(totalAmount)}`}
        </button>
      </div>
    </div>
  );
};
