import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Server, Database, Settings as SettingsIcon, 
  PlusCircle, Terminal, LogOut, ChevronRight,
  ShieldCheck
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "./lib/utils";
import Dashboard from "./pages/Dashboard";
import Nodes from "./pages/Nodes";
import Servers from "./pages/Servers";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import { auth } from "./lib/firebase";
import { usePanelSettings } from "./lib/settings";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const { settings, loading: settingsLoading } = usePanelSettings();

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
    });
  }, []);

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0E] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "nodes": return <Nodes />;
      case "servers": return <Servers />;
      case "settings": return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0D0D0E]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1A1A1B] flex flex-col fixed inset-y-0 z-20 bg-[#0D0D0E]">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: settings.primaryColor }}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <ShieldCheck className="text-white w-5 h-5" />
            )}
          </div>
          <span className="font-medium tracking-tight text-lg truncate">{settings.panelName.split(' ')[0]}</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
          />
          <NavItem 
            icon={Database} 
            label="Nodes" 
            active={activeTab === "nodes"} 
            onClick={() => setActiveTab("nodes")} 
          />
          <NavItem 
            icon={Server} 
            label="Bot Instances" 
            active={activeTab === "servers"} 
            onClick={() => setActiveTab("servers")} 
          />
          <div className="pt-8 pb-2 px-3 text-[10px] font-mono text-[#636366] uppercase tracking-widest">Advanced</div>
          <NavItem 
            icon={Terminal} 
            label="CLI / API" 
            active={activeTab === "cli"} 
            onClick={() => setActiveTab("cli")} 
          />
          <NavItem 
            icon={SettingsIcon} 
            label="Configuration" 
            active={activeTab === "settings"} 
            onClick={() => setActiveTab("settings")} 
          />
        </nav>

        <div className="p-4 border-t border-[#1A1A1B]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user.email?.split('@')[0]}</div>
              <div className="text-[10px] text-[#636366] truncate">{user.email}</div>
            </div>
            <button onClick={() => auth.signOut()} className="text-[#636366] hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
        active 
          ? "bg-[#1A1A1B] text-white" 
          : "text-[#636366] hover:text-[#A1A1AA] hover:bg-[#1A1A1B]/50"
      )}
    >
      <Icon className={cn("w-4 h-4 transition-colors", active ? "text-blue-500" : "text-[#636366] group-hover:text-[#A1A1AA]")} />
      <span className="text-sm font-medium">{label}</span>
      {active && <motion.div layoutId="active" className="ml-auto w-1 h-4 bg-blue-500 rounded-full" />}
    </button>
  );
}

