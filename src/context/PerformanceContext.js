import { createContext, useContext, useEffect, useState } from "react";

import { setPerformanceMetric } from "../data/performanceProfile";
import { loadPerformanceProfile, savePerformanceProfile } from "../services/performanceProfileStorage";
import { deriveTrainingZones } from "../utils/trainingZones";

const PerformanceContext = createContext(null);
export function PerformanceProvider({ children }) {
  const [profile, setProfile] = useState(null);
  useEffect(() => { loadPerformanceProfile().then(setProfile); }, []);
  function updateMetric(section, field, value) { setProfile((current) => { const next = setPerformanceMetric(current, section, field, value); if (next) savePerformanceProfile(next); return next || current; }); }
  return <PerformanceContext.Provider value={{ profile, zones: profile ? deriveTrainingZones(profile) : null, updateMetric }}>{children}</PerformanceContext.Provider>;
}
export function usePerformance() { const context = useContext(PerformanceContext); if (!context) throw new Error("usePerformance muss innerhalb des PerformanceProvider verwendet werden."); return context; }
