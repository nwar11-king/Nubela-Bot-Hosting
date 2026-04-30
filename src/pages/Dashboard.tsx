import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { 
  Server, Cpu, Database, Activity, Shield, 
  Terminal, Globe, HardDrive, Plus, MoreVertical,
  CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";

const data = [
  { name: "00:00", cpu: 40, ram: 24, net: 2400 },
  { name: "04:00", cpu: 30, ram: 13, net: 2210 },
  { name: "08:00", cpu: 20, ram: 98, net: 2290 },
  { name: "12:00", cpu: 27, ram: 39, net: 2000 },
  { name: "16:00", cpu: 18, ram: 48, net: 2181 },
  { name: "20:00", cpu: 23, ram: 38, net: 2500 },
  { name: "23:59", cpu: 34, ram: 43, net: 2100 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    nodes: 0,
    servers: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: nodeCount } = await supabase.from("nodes").select("*", { count: "exact", head: true });
      const { count: serverCount } = await supabase.from("servers").select("*", { count: "exact", head: true });
      
      setStats({
        nodes: nodeCount || 0,
        servers: serverCount || 0,
        loading: false
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Fleet Overview</h1>
          <p className="text-sm text-[#636366] font-mono mt-1 uppercase tracking-widest">Global Status: Optimal</p>
        </div>
        <div className="flex gap-4">
          <StatMini icon={CheckCircle2} label="Nodes Online" value={`${stats.nodes}/${stats.nodes}`} color="text-green-500" />
          <StatMini icon={AlertCircle} label="Active Alerts" value="0" color="text-zinc-500" />
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Bots", value: stats.servers.toLocaleString(), sub: "+0 today", icon: Server },
          { label: "CPU Usage", value: "42.1%", sub: "Avg across fleet", icon: Cpu },
          { label: "RAM Usage", value: "64.8GB", sub: "of 128GB total", icon: Database },
          { label: "Network", value: "24.5 GB/s", sub: "Peak throughput", icon: Globe },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-[#151516] border border-[#242426] rounded-lg hover:border-[#3A3A3C] transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <stat.icon className="w-5 h-5 text-[#636366]" />
              <div className="text-[10px] font-mono text-[#636366] uppercase tracking-wider px-2 py-1 bg-[#1A1A1B] rounded">RT-LOG</div>
            </div>
            <div className="text-3xl font-medium mb-1 tracking-tighter">{stat.value}</div>
            <div className="text-xs text-[#636366] flex justify-between">
              <span>{stat.label}</span>
              <span className="text-[#A1A1AA]">{stat.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-6 bg-[#151516] border border-[#242426] rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-mono uppercase tracking-widest text-[#636366]">Resource Consumption</h3>
            <div className="flex gap-4 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>CPU %</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span>RAM %</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242426" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#636366" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#636366" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151516', border: '1px solid #242426', borderRadius: '4px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                <Area type="monotone" dataKey="ram" stroke="#6366f1" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-[#151516] border border-[#242426] rounded-lg">
          <h3 className="text-sm font-mono uppercase tracking-widest text-[#636366] mb-6">Recent Log Activity</h3>
          <div className="space-y-4">
            {[
              { time: "2:14 PM", msg: "Node-UK-1: Deployment successful", type: "success" },
              { time: "2:10 PM", msg: "Bot 'Music-Pro' restarted", type: "info" },
              { time: "1:55 PM", msg: "Cloudflare Tunnel connected", type: "success" },
              { time: "1:42 PM", msg: "High latency detected on Node-US-3", type: "warning" },
              { time: "1:30 PM", msg: "Backup process completed", type: "success" },
            ].map((log, i) => (
              <div key={i} className="flex gap-4 items-start text-xs font-mono">
                <span className="text-[#636366] whitespace-nowrap">{log.time}</span>
                <span className={cn(
                  "flex-1",
                  log.type === "success" ? "text-green-500" :
                  log.type === "warning" ? "text-amber-500" : "text-[#A1A1AA]"
                )}>{log.msg}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-2 border border-[#242426] hover:bg-[#1A1A1B] text-[10px] font-mono uppercase tracking-widest transition-colors rounded">
            View Live Stream
          </button>
        </div>
      </div>
    </div>
  );
}

function StatMini({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#151516] border border-[#242426] px-4 py-2 rounded-lg">
      <Icon className={cn("w-4 h-4", color)} />
      <div>
        <div className="text-[9px] font-mono uppercase text-[#636366] tracking-tighter">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
