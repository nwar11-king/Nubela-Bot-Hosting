import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useState, useEffect } from "react";

export interface PanelSettings {
  panelName: string;
  logoUrl: string;
  primaryColor: string;
  allowSignups: boolean;
  footerText: string;
}

const DEFAULT_SETTINGS: PanelSettings = {
  panelName: "Nebula Control Panel",
  logoUrl: "",
  primaryColor: "#2563eb",
  allowSignups: true,
  footerText: "Secure Handshake Required • Edge-Authenticated SSL"
};

export function usePanelSettings() {
  const [settings, setSettings] = useState<PanelSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as PanelSettings);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { settings, loading };
}

export async function updatePanelSettings(newSettings: Partial<PanelSettings>) {
  await setDoc(doc(db, "settings", "global"), newSettings, { merge: true });
}
