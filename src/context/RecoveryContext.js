import { createContext, useContext } from "react";

import { useRecoveryState } from "../hooks/useRecovery";

const RecoveryContext = createContext(null);

export function RecoveryProvider({ children }) {
  const recovery = useRecoveryState();
  return <RecoveryContext.Provider value={recovery}>{children}</RecoveryContext.Provider>;
}

export function useRecovery() {
  const context = useContext(RecoveryContext);
  if (!context) throw new Error("useRecovery muss innerhalb des RecoveryProvider verwendet werden.");
  return context;
}
