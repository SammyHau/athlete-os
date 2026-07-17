import { createContext, useContext } from "react";

import { useIntegrationsState } from "../hooks/useIntegrations";
import { useTraining } from "./TrainingContext";

const IntegrationContext = createContext(null);

export function IntegrationProvider({ children }) {
  const { sessions } = useTraining();
  const integrations = useIntegrationsState(sessions);
  return <IntegrationContext.Provider value={integrations}>{children}</IntegrationContext.Provider>;
}

export function useIntegrations() {
  const context = useContext(IntegrationContext);
  if (!context) throw new Error("useIntegrations muss innerhalb des IntegrationProvider verwendet werden.");
  return context;
}
