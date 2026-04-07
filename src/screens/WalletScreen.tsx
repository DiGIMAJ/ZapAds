import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../App';
import { ChevronLeft, Wallet, ArrowUpRight, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';

export const WalletScreen = () => {
  const { profile } = useUser();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });

  useEffect(() => {
    if (!profile) return;
    
    // Fetch completed ads to calculate balance
    const adsQ = query(collection(db, 'ads'), where('publisherId', '==', profile.uid), where('status', '==', 'completed'));
    const unsubscribeAds = onSnapshot(adsQ, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch withdrawals
    const withQ = query(collection(db, 'withdrawals'), where('userId', '==', profile.uid));
    const unsubscribeWith = onSnapshot(withQ, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });

    return () => {
      unsubscribeAds();
      unsubscribeWith();
    };
  }, [profile]);

  const totalEarnings = ads.reduce((sum, ad) => sum + (ad.publisherEarnings || 0), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status !== 'failed').reduce((sum, w) => sum + (w.amount || 0), 0);
  const balance = totalEarnings - totalWithdrawn;

  const handleWithdraw = async () => {
    if (balance < 1000) {
      alert('Minimum withdrawal is ₦1,000');
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName) {
      alert('Please fill in all bank details');
      return;
    }

    setWithdrawing(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        userId: profile?.uid,
        amount: balance,
        status: 'pending',
        bankDetails,
        createdAt: new Date().toISOString()
      });

      // Notify admin (conceptually)
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin', // Or a specific admin UID
        type: 'withdrawal_request',
        message: `${profile?.name} requested a withdrawal of ${formatCurrency(balance)}`,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      alert('Withdrawal request submitted! You will receive your funds within 24-48 hours.');
      setBankDetails({ accountNumber: '', bankName: '', accountName: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to submit withdrawal request.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading wallet...</div>;

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-4 flex items-center gap-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-lg">My Wallet</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Balance Card */}
        <div className="bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-gray-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/20 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative z-10">
            <p className="text-gray-400 text-sm font-bold mb-2">Available Balance</p>
            <h2 className="text-4xl font-black mb-6">{formatCurrency(balance)}</h2>
            <div className="flex gap-4">
              <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Total Earned</p>
                <p className="font-bold">{formatCurrency(totalEarnings)}</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Withdrawn</p>
                <p className="font-bold">{formatCurrency(totalWithdrawn)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-gray-50 p-6 rounded-[2rem] space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-[#25D366]" />
            Request Payout
          </h3>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Account Name"
              className="w-full p-4 bg-white rounded-xl border-none focus:ring-2 focus:ring-[#25D366] text-sm font-medium"
              value={bankDetails.accountName}
              onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Account Number"
              className="w-full p-4 bg-white rounded-xl border-none focus:ring-2 focus:ring-[#25D366] text-sm font-medium"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Bank Name"
              className="w-full p-4 bg-white rounded-xl border-none focus:ring-2 focus:ring-[#25D366] text-sm font-medium"
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
            />
          </div>
          <button 
            onClick={handleWithdraw}
            disabled={withdrawing || balance < 1000}
            className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {withdrawing ? <Loader2 className="animate-spin mx-auto" /> : `Withdraw ${formatCurrency(balance)}`}
          </button>
          <p className="text-[10px] text-gray-400 text-center">Minimum withdrawal: ₦1,000</p>
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 px-2">Recent Transactions</h3>
          {withdrawals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <Clock className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-500 text-sm">No withdrawals yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      w.status === 'completed' ? "bg-green-50 text-green-600" :
                      w.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                      "bg-red-50 text-red-600"
                    )}>
                      {w.status === 'completed' ? <CheckCircle2 size={20} /> : 
                       w.status === 'pending' ? <Clock size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Payout Request</p>
                      <p className="text-[10px] text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(w.amount)}</p>
                    <p className={cn(
                      "text-[10px] font-bold uppercase",
                      w.status === 'completed' ? "text-green-600" :
                      w.status === 'pending' ? "text-yellow-600" :
                      "text-red-600"
                    )}>{w.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
