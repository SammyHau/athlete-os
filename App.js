import { SafeAreaProvider } from "react-native-safe-area-context";

import { TrainingProvider } from "./src/context/TrainingContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <TrainingProvider>
        <AppNavigator />
      </TrainingProvider>
    </SafeAreaProvider>
  );
}
