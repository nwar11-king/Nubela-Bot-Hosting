import React, { useState, useEffect } from "react";
import { 
  Server, HardDrive, Plus, Terminal, Copy, 
  Check, Info, Shield, RefreshCw, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";

export default function Nodes() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nodeName, setNodeName] = useState("Main-VPS-1");

  useEffect(() => {
    const fetchNodes = async () => {
      const { data, error } = await supabase.from("nodes").select("*");
      if (!error) setNodes(data || []);
      setLoading(false);
    };

    fetchNodes();

    const channelId = `nodes-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "nodes" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setNodes(prev => [...prev, payload.new]);
        } else if (payload.eventType === "UPDATE") {
          setNodes(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        } else if (payload.eventType === "DELETE") {
          setNodes(prev => prev.filter(n => n.id === payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const apiKey = "ne_live_" + Math.random().toString(36).substring(7);
  const installCommand = `curl -sSL ${window.location.origin}/api/install?key=${apiKey}&nodeName=${nodeName} | bash`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Active Nodes</h1>
          <p className="text-sm text-[#636366] font-mono mt-1 uppercase tracking-widest">Compute Instances: 3 Clusters</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Deploy New Node
        </button>
      </header>

      <div className="space-y-1">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px] px-4 py-2 text-[10px] uppercase font-mono text-[#636366] tracking-widest">
          <div>Instance Ident / Region</div>
          <div>Status</div>
          <div>CPU / Memory</div>
          <div>Storage</div>
          <div></div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#242426] rounded-xl text-[#636366] text-sm">
            No nodes connected. Use the deployment script to add your first node.
          </div>
        ) : nodes.map((node, i) => (
          <div key={node.id} className="data-row grid-cols-[1.5fr_1fr_1fr_1fr_80px] items-center">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                node.status === "online" ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-500"
              )}>
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-sm">{node.name}</div>
                <div className="text-[10px] font-mono text-[#636366]">{node.region || 'Unknown Region'} • {node.ip}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", node.status === 'online' ? 'bg-green-500' : 'bg-red-500')} />
              <span className="text-xs uppercase font-mono tracking-tighter">{node.status}</span>
            </div>
            <div className="text-xs font-mono">
              <div className="text-[#A1A1AA]">{node.cpuCores || 0} Core</div>
              <div className="text-[#636366]">{node.ramTotal ? `${(node.ramTotal / 1024).toFixed(1)}GB` : '0GB'}</div>
            </div>
            <div className="text-xs font-mono">
              <div className="text-[#A1A1AA]">{node.diskUsage || '0/0GB'}</div>
              <div className="w-24 h-1 bg-[#1A1A1B] rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '0%' }} />
              </div>
            </div>
            <button className="text-[#636366] hover:text-white justify-self-end p-2 transition-colors">
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Node Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151516] border border-[#242426] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-medium">Add New Node</h2>
                  <p className="text-sm text-[#636366] mt-1">Deploy our high-performance daemon on your own infrastructure.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest block mb-2">Instance Name</label>
                    <input 
                      type="text" 
                      value={nodeName}
                      onChange={(e) => setNodeName(e.target.value)}
                      className="w-full bg-[#1A1A1B] border border-[#242426] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                      placeholder="e.g. London-Edge-01"
                    />
                  </div>

                  <div className="p-4 bg-[#09090A] border border-[#1A1A1B] rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#636366]">
                        <Terminal className="w-3 h-3" />
                        <span>Installer Command</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px] font-bold uppercase tracking-wider">
                        <Shield className="w-2.5 h-2.5" /> Secure
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <pre className="bg-[#151516] p-4 rounded-md text-xs font-mono overflow-x-auto text-blue-400 border border-[#1A1A1B] whitespace-pre-wrap break-all pr-12">
                        {installCommand}
                      </pre>
                      <button 
                        onClick={copyToClipboard}
                        className="absolute top-4 right-4 p-2 bg-[#1A1A1B] border border-[#242426] rounded hover:bg-[#242426] transition-colors text-white"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex gap-4 items-start text-[10px] leading-relaxed text-[#636366]">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>Run this script on any clean Ubuntu 20.04+ or Debian 11+ system. It will automatically install Docker, Nginx, and link the node to your Nebula account.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-[#1A1A1B]">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 text-sm font-medium text-[#A1A1AA] hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <button className="bg-[#1A1A1B] border border-[#242426] hover:bg-[#242426] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Check Status
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
