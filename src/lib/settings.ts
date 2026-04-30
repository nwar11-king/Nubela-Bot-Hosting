import { supabase } from "./supabase";
import { useState, useEffect } from "react";

export interface PanelSettings {
  panel_name: string;
  logo_url: string;
  primary_color: string;
  allow_signups: boolean;
  footer_text: string;
}

const DEFAULT_SETTINGS: PanelSettings = {
  panel_name: "Nebula Control Panel",
  logo_url: "",
  primary_color: "#2563eb",
  allow_signups: true,
  footer_text: "Secure Handshake Required • Edge-Authenticated SSL"
};

export function usePanelSettings() {
  const [settings, setSettings] = useState<PanelSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", "global")
        .single();
      
      if (data && !error) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
      setLoading(false);
    };

    fetchSettings();

    // Subscribe to changes
    const channelId = `settings-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings", filter: "id=eq.global" },
        (payload) => {
          setSettings(prev => prev ? ({ ...prev, ...payload.new }) : payload.new as PanelSettings);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
}

export async function updatePanelSettings(newSettings: Partial<PanelSettings>) {
  const { error } = await supabase
    .from("settings")
    .upsert({ id: "global", ...newSettings });
  
  if (error) throw error;
}
