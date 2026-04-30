import React, { useState, useEffect } from "react";
import { 
  Server as ServerIcon, Cpu, Database, Activity, Play, Square, 
  RotateCcw, Terminal, Settings, Trash2, Search, Filter,
  PlusCircle, Globe, Loader2, X
} from "lucide-react";
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function Servers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nodes, setNodes] = useState<any[]>([]);

  // New bot state
  const [newName, setNewName] = useState("");
  const [newSubdomain, setNewSubdomain] = useState("");
  const [newNodeId, setNewNodeId] = useState("");
  const [newImage, setNewImage] = useState("node:18-alpine");

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "servers"), where("ownerId", "==", auth.currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      setBots(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const nodesUnsub = onSnapshot(collection(db, "nodes"), (snap) => {
      setNodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsub(); nodesUnsub(); };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, "servers"), {
        name: newName,
        subdomain: newSubdomain,
        nodeId: newNodeId,
        ownerId: auth.currentUser.uid,
        status: "starting",
        dockerImage: newImage,
        cpuUsage: 0,
        memoryUsage: 0,
        createdAt: serverTimestamp()
      });
      setShowCreateModal(false);
      setNewName("");
      setNewSubdomain("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this instance?")) {
      await deleteDoc(doc(db, "servers", id));
    }
  };

  const toggleStatus = async (bot: any) => {
    const newStatus = bot.status === 'running' ? 'stopped' : 'running';
    await updateDoc(doc(db, "servers", bot.id), { status: newStatus });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Bot Instances</h1>
          <p className="text-sm text-[#636366] font-mono mt-1 uppercase tracking-widest">Active Deployments: 4 Stable</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
            <input 
              type="text" 
              placeholder="Search instances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#151516] border border-[#242426] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-64"
            />
          </div>
          <button className="bg-[#151516] border border-[#242426] p-2 rounded-lg hover:border-[#3A3A3C] transition-colors">
            <Filter className="w-4 h-4 text-[#A1A1AA]" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : bots.map((bot, i) => (
          <div key={bot.id} className="bg-[#151516] border border-[#242426] rounded-xl overflow-hidden hover:border-[#3A3A3C] transition-all group shadow-sm hover:shadow-xl">
            <div className="p-5 space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    bot.status === 'running' ? 'bg-blue-500/10 text-blue-500' : 
                    bot.status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-500'
                  )}>
                    <ServerIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm group-hover:text-blue-500 transition-colors">{bot.name}</h3>
                    <div className="text-[10px] font-mono text-[#636366] flex flex-col mt-1">
                      <div className="flex items-center gap-1.5 ">
                        <span className="uppercase tracking-wider px-1 bg-[#1A1A1B] rounded text-[8px]">{bot.dockerImage}</span>
                        <span>•</span>
                        <span>{nodes.find(n => n.id === bot.nodeId)?.name || 'Unknown Node'}</span>
                      </div>
                      {bot.subdomain && (
                        <div className="flex items-center gap-1 mt-0.5 text-blue-400">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{bot.subdomain}.bothosting.site</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5",
                  bot.status === 'running' ? 'bg-green-500/10 text-green-500' : 
                  bot.status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-500'
                )}>
                  <div className={cn("w-1 h-1 rounded-full", bot.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-zinc-500')} />
                  {bot.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Metric label="CPU" value={`${bot.cpuUsage || 0}%`} />
                <Metric label="RAM" value={`${bot.memoryUsage || 0}MB`} />
              </div>
            </div>

            <div className="bg-[#1A1A1B] px-5 py-3 flex justify-between items-center">
              <div className="flex gap-2">
                {bot.status === 'running' ? (
                  <ActionButton icon={Square} label="Stop" color="hover:text-red-500" onClick={() => toggleStatus(bot)} />
                ) : (
                  <ActionButton icon={Play} label="Start" color="hover:text-green-500" onClick={() => toggleStatus(bot)} />
                )}
                <ActionButton icon={RotateCcw} label="Restart" color="hover:text-amber-500" />
                <ActionButton icon={Terminal} label="Console" color="hover:text-white" />
              </div>
              <div className="flex gap-2">
                <ActionButton icon={Settings} label="Config" color="hover:text-white" />
                <ActionButton icon={Trash2} label="Delete" color="hover:text-red-500" onClick={() => handleDelete(bot.id)} />
              </div>
            </div>
          </div>
        ))}
        
        {/* Placeholder for new bot */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="border-2 border-dashed border-[#242426] rounded-xl flex flex-col items-center justify-center p-8 text-[#636366] hover:text-[#A1A1AA] hover:border-[#3A3A3C] transition-all group space-y-3 bg-[#0D0D0E]"
        >
          <div className="p-3 bg-zinc-900 rounded-lg group-hover:bg-zinc-800 transition-colors">
            <PlusCircle className="w-8 h-8" />
          </div>
          <div className="text-center">
            <div className="font-medium">Deploy Instance</div>
            <div className="text-xs mt-1">Select node to scale fleet</div>
          </div>
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151516] border border-[#242426] rounded-2xl w-full max-w-lg p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-medium mb-6">Create New Instance</h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest block px-1">Instance Name</label>
                  <input 
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#0D0D0E] border border-[#242426] rounded-xl px-4 py-3 text-sm"
                    placeholder="My Music Bot"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest block px-1">Target Node</label>
                  <select 
                    required
                    value={newNodeId}
                    onChange={(e) => setNewNodeId(e.target.value)}
                    className="w-full bg-[#0D0D0E] border border-[#242426] rounded-xl px-4 py-3 text-sm appearance-none"
                  >
                    <option value="">Select a node...</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} ({n.status})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-[#636366] tracking-widest block px-1">Subdomain (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      value={newSubdomain}
                      onChange={(e) => setNewSubdomain(e.target.value)}
                      className="flex-1 bg-[#0D0D0E] border border-[#242426] rounded-xl px-4 py-3 text-sm font-mono"
                      placeholder="music-bot"
                    />
                    <span className="text-xs text-[#636366] font-mono">.bothosting.site</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-600/10"
                  >
                    Deploy to Cluster
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Metric({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-[#1A1A1B] p-2 rounded-lg border border-[#242426]">
      <div className="text-[9px] font-mono text-[#636366] uppercase tracking-tighter">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} title={label} className={cn("text-[#636366] transition-colors p-1.5 hover:bg-[#242426] rounded", color)}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

import { PlusCircle } from "lucide-react";
