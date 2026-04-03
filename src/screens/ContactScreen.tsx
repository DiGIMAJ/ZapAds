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
          <a 
            href="https://wa.me/23481588562?text=Hello%20ZapAds%20Support,%20I%20need%20help%20with..."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
          >
            <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center text-[#25D366]">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">WhatsApp</p>
              <p className="font-bold">+234 815 885 62</p>
            </div>
          </a>

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
