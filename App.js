import { SafeAreaProvider } from "react-native-safe-area-context";

import { RecoveryProvider } from "./src/context/RecoveryContext";
import { IntegrationProvider } from "./src/context/IntegrationContext";
import { TrainingProvider } from "./src/context/TrainingContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <TrainingProvider>
        <RecoveryProvider>
          <IntegrationProvider>
            <AppNavigator />
          </IntegrationProvider>
        </RecoveryProvider>
      </TrainingProvider>
    </SafeAreaProvider>
  );
}
