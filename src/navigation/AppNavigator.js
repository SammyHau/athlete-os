import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { HomeScreen } from "../screens/HomeScreen";
import { TrainingScreen } from "../screens/TrainingScreen";
import { PlanScreen } from "../screens/PlanScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

function TabIcon({ symbol, focused }) {
  return (
    <Text
      style={{
        fontSize: 18,
        opacity: focused ? 1 : 0.45,
      }}
    >
      {symbol}
    </Text>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.textPrimary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            height: 84,
            paddingTop: 8,
            paddingBottom: 20,
            borderTopWidth: 0,
            backgroundColor: colors.surface,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon symbol="¦" focused={focused} />
            ),
          }}
        />

        <Tab.Screen
          name="Training"
          component={TrainingScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon symbol="?" focused={focused} />
            ),
          }}
        />

        <Tab.Screen
          name="Plan"
          component={PlanScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon symbol="?" focused={focused} />
            ),
          }}
        />

        <Tab.Screen
          name="Progress"
          component={ProgressScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon symbol="?" focused={focused} />
            ),
          }}
        />

        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon symbol="?" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
