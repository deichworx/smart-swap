import './polyfills';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Debug from './screens/Debug';
import History from './screens/History';
import Home from './screens/Home';
import { PrivacyPolicy, TermsOfService } from './screens/Legal';
import Loyalty from './screens/Loyalty';
import Settings from './screens/Settings';
import Swap from './screens/Swap';
import { colors } from './theme';
import { wallet } from './wallet/wallet';

export type RootStackParamList = {
  Home: undefined;
  Swap: undefined;
  History: undefined;
  Settings: undefined;
  Loyalty: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  Debug: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg.primary,
    card: colors.bg.primary,
    border: colors.border.primary,
  },
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Home' | 'Swap' | null>(null);

  useEffect(() => {
    console.log('[App] Checking for stored session...');
    wallet.restoreSession().then(restored => {
      console.log('[App] Session restored:', restored);
      setInitialRoute(restored ? 'Swap' : 'Home');
    });
  }, []);

  // Show loading spinner while checking session
  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.primary, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent.purple} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg.primary },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Swap" component={Swap} />
          <Stack.Screen name="History" component={History} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="Loyalty" component={Loyalty} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
          <Stack.Screen name="TermsOfService" component={TermsOfService} />
          {__DEV__ && <Stack.Screen name="Debug" component={Debug} />}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
