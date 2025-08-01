import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OtpScreen from './src/screens/auth/OtpScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CreateRequestScreen from './src/screens/request/CreateRequestScreen';
import RequestDetailScreen from './src/screens/request/RequestDetailScreen';
import ContactsScreen from './src/screens/contacts/ContactsScreen';
import AddContactScreen from './src/screens/contacts/AddContactScreen';
import ContactDetailScreen from './src/screens/contacts/ContactDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import components
import CustomTabBar from './src/components/CustomTabBar';
import NoInternetModal from './src/components/NoInternetModal';

// Import context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Import utils
import { API_BASE_URL } from './src/utils/config';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563EB',
    accent: '#10B981',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1F2937',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    disabled: '#9CA3AF',
    placeholder: '#6B7280',
    border: '#E5E7EB',
    notification: '#EF4444',
  },
  roundness: 12,
};

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: 'home',
        }}
      />
      <Tab.Screen 
        name="CreateRequest" 
        component={CreateRequestScreen}
        options={{
          tabBarLabel: 'New Request',
          tabBarIcon: 'plus-circle',
        }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={ContactsScreen}
        options={{
          tabBarLabel: 'Contacts',
          tabBarIcon: 'contacts',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: 'settings',
        }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator
function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check authentication status on app start
    checkAuthStatus();

    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Show offline message when internet is lost
    if (!isOnline) {
      Toast.show({
        type: 'error',
        text1: 'No Internet Connection',
        text2: 'Please check your connection and try again',
        position: 'top',
      });
    }
  }, [isOnline]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="AddContact" component={AddContactScreen} />
            <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App Component
function App() {
  return (
    <PaperProvider theme={theme}>
      <ThemeProvider>
        <AuthProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={theme.colors.background}
            />
            <AppNavigator />
            <Toast />
            <NoInternetModal />
          </SafeAreaView>
        </AuthProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default App;