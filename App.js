import { SafeAreaProvider } from "react-native-safe-area-context";

import { RecoveryProvider } from "./src/context/RecoveryContext";
import { IntegrationProvider } from "./src/context/IntegrationContext";
import { TrainingProvider } from "./src/context/TrainingContext";
import { PerformanceProvider } from "./src/context/PerformanceContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <TrainingProvider>
        <PerformanceProvider>
          <RecoveryProvider>
            <IntegrationProvider>
              <AppNavigator />
            </IntegrationProvider>
          </RecoveryProvider>
        </PerformanceProvider>
      </TrainingProvider>
    </SafeAreaProvider>
  );
}
