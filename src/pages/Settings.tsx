import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, Save, Image as ImageIcon, 
  Palette, Shield, Globe, Terminal, RefreshCw, Loader2,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import { usePanelSettings, updatePanelSettings, PanelSettings } from "../lib/settings";
import { cn } from "../lib/utils";

export default function Settings() {
  const { settings: initialSettings, loading } = usePanelSettings();
  const [settings, setSettings] = useState<PanelSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      await updatePanelSettings(settings);
      setMessage("Settings updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">System Configuration</h1>
          <p className="text-sm text-[#636366] font-mono mt-1 uppercase tracking-widest">Panel Branding & Access Controls</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding Section */}
        <section className="p-6 bg-[#151516] border border-[#242426] rounded-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-[#242426] pb-4">
            <Palette className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium">Branding & Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest">Panel Name</label>
              <input 
                type="text" 
                value={settings.panel_name}
                onChange={(e) => setSettings({ ...settings, panel_name: e.target.value })}
                className="w-full bg-[#1A1A1B] border border-[#242426] rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-colors"
                placeholder="Nebula Control Panel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest">Primary Color (Hex)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="flex-1 bg-[#1A1A1B] border border-[#242426] rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-colors font-mono"
                  placeholder="#2563eb"
                />
                <div className="w-10 h-10 rounded-lg border border-[#242426]" style={{ backgroundColor: settings.primary_color }} />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest">Logo URL</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  className="flex-1 bg-[#1A1A1B] border border-[#242426] rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-colors"
                  placeholder="https://example.com/logo.png"
                />
                <div className="w-10 h-10 bg-[#1A1A1B] border border-[#242426] rounded-lg flex items-center justify-center overflow-hidden">
                  {settings.logo_url ? <img src={settings.logo_url} className="w-full h-full object-contain" alt="Logo preview" /> : <ImageIcon className="w-4 h-4 text-[#636366]" />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="p-6 bg-[#151516] border border-[#242426] rounded-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-[#242426] pb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h3 className="font-medium">Access & Security</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1A1A1B] border border-[#242426] rounded-lg">
            <div>
              <div className="text-sm font-medium">Allow New Signups</div>
              <p className="text-xs text-[#636366]">Enable public registration for the panel</p>
            </div>
            <button 
              type="button"
              onClick={() => setSettings({ ...settings, allow_signups: !settings.allow_signups })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                settings.allow_signups ? "bg-blue-600" : "bg-zinc-800"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                settings.allow_signups ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest">Footer Text (Customizable)</label>
            <input 
              type="text" 
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              className="w-full bg-[#1A1A1B] border border-[#242426] rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none transition-colors"
              placeholder="All rights reserved..."
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-6 pt-4">
          {message && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-mono flex items-center gap-2 text-[#A1A1AA]"
            >
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              {message}
            </motion.div>
          )}
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Persist Changes
          </button>
        </div>
      </form>
    </div>
  );
}
