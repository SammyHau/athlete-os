import { createContext, useContext } from "react";

import { useTrainingPlan } from "../hooks/useTrainingPlan";

const TrainingContext = createContext(null);

export function TrainingProvider({ children }) {
  const training = useTrainingPlan();
  return (
    <TrainingContext.Provider value={training}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error("useTraining muss innerhalb des TrainingProvider verwendet werden.");
  }
  return context;
}
