import React from 'react';
import { ChevronLeft, Mail, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ContactScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 font-sans">
      <header className="flex items-center gap-4 mb-8 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Contact Us</h1>
      </header>

      <div className="max-w-md mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter">Get in touch.</h2>
          <p className="text-gray-400">We're here to help you scale your WhatsApp TV business.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center text-[#25D366]">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Email</p>
              <p className="font-bold">support@zapads.com</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center text-[#25D366]">
              <Phone size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Phone</p>
              <p className="font-bold">+234 800 ZAP ADS</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center text-[#25D366]">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Office</p>
              <p className="font-bold">Lagos, Nigeria</p>
            </div>
          </div>
        </div>

        <form className="space-y-4 pt-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Message</label>
            <textarea 
              rows={4}
              required
              placeholder="How can we help you?"
              className="w-full bg-white/5 border border-white/10 focus:border-[#25D366] rounded-2xl p-4 text-white outline-none transition-all resize-none"
            ></textarea>
          </div>
          <button 
            type="submit"
            className="w-full bg-[#25D366] text-black font-black py-4 rounded-2xl hover:bg-[#1ebe57] transition-all active:scale-95"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};
