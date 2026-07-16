import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

import { HomeScreen } from "../screens/HomeScreen";
import { TrainingScreen } from "../screens/TrainingScreen";
import { PlanScreen } from "../screens/PlanScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

function TabIcon({ name, color, size }) {
  return <Ionicons name={name} color={color} size={size} />;
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
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "home" : "home-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Training"
          component={TrainingScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "barbell" : "barbell-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Plan"
          component={PlanScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "calendar" : "calendar-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Progress"
          component={ProgressScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "stats-chart" : "stats-chart-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={focused ? "person" : "person-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
