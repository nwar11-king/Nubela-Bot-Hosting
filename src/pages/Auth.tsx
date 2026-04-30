import React, { useState } from "react";
import { 
  ShieldCheck, ArrowRight, Github, Mail, 
  Lock, AlertCircle, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { usePanelSettings } from "../lib/settings";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { settings, loading: settingsLoading } = usePanelSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (settingsLoading) return null;

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Verification email sent!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0E] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative radial gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#151516] border border-[#242426] rounded-2xl p-8 relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg overflow-hidden"
            style={{ backgroundColor: settings.primary_color }}
          >
            {settings.logo_url ? (
              <img src={settings.logo_url} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <ShieldCheck className="text-white w-7 h-7" />
            )}
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-center">{settings.panel_name}</h1>
          <p className="text-xs text-[#636366] font-mono mt-1 uppercase tracking-widest text-center">Protocol-Level Access</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest px-1">Identity Endpoint</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636366]" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@provider.com"
                className="w-full bg-[#0D0D0E] border border-[#242426] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest px-1">Access Token</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636366]" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0D0D0E] border border-[#242426] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                minLength={6}
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex gap-2 text-red-500 text-xs bg-red-500/5 p-3 rounded-lg border border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                {mode === 'signin' ? 'Initiate Session' : 'Register Host'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-[#242426]">
          <div className="flex-1 h-px bg-current"></div>
          <span className="text-[10px] font-mono text-[#636366] uppercase whitespace-nowrap tracking-tighter">External Auth Path</span>
          <div className="flex-1 h-px bg-current"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleGoogleAuth}
            className="flex items-center justify-center gap-2 border border-[#242426] hover:bg-[#1A1A1B] py-2.5 rounded-xl text-sm transition-colors"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-4 h-4" alt="Google" />
            <span>Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 border border-[#242426] hover:bg-[#1A1A1B] py-2.5 rounded-xl text-sm transition-colors text-[#636366]">
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-[#636366]">
          {mode === 'signin' ? "First time initiating?" : "Already have identity?"}{" "}
          <button 
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-blue-500 hover:underline font-medium"
          >
            {mode === 'signin' ? 'Provision Account' : 'Resume Session'}
          </button>
        </p>
      </motion.div>

      <footer className="mt-12 text-[10px] font-mono text-[#444] uppercase tracking-[0.2em] relative z-10">
        {settings.footer_text}
      </footer>
    </div>
  );
}
