import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { STORAGE_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/config';

// Initial state
const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT',
  RESET: 'RESET',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.SET_AUTHENTICATED:
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
      };
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    case AUTH_ACTIONS.RESET:
      return initialState;
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app start
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Get stored token and user data
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (token && userData) {
        // Verify token with server
        try {
          const response = await apiService.auth.getProfile();
          const user = response.data.user;

          dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
          dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: true });
        } catch (error) {
          // Token is invalid, clear stored data
          await logout();
        }
      }
    } catch (error) {
      console.error('Auth status check error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await apiService.auth.login(credentials);
      const { token, user } = response.data;

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);

      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: true });

      return { success: true, message: SUCCESS_MESSAGES.LOGIN_SUCCESS };
    } catch (error) {
      const errorMessage = error.message || ERROR_MESSAGES.INVALID_CREDENTIALS;
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await apiService.auth.register(userData);
      const { token, user } = response.data;

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);

      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: true });

      return { success: true, message: SUCCESS_MESSAGES.REGISTER_SUCCESS };
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Send OTP function
  const sendOtp = async (phone, type = 'phone') => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      await apiService.auth.sendOtp({ phone, type });

      return { success: true, message: SUCCESS_MESSAGES.OTP_SENT };
    } catch (error) {
      const errorMessage = error.message || 'Failed to send OTP';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Verify OTP function
  const verifyOtp = async (phone, otp, type = 'phone') => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      await apiService.auth.verifyOtp({ phone, otp, type });

      return { success: true, message: SUCCESS_MESSAGES.OTP_VERIFIED };
    } catch (error) {
      const errorMessage = error.message || ERROR_MESSAGES.INVALID_OTP;
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Forgot password function
  const forgotPassword = async (phone) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      await apiService.auth.forgotPassword({ phone });

      return { success: true, message: 'Password reset code sent successfully' };
    } catch (error) {
      const errorMessage = error.message || 'Failed to send reset code';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Reset password function
  const resetPassword = async (phone, otp, newPassword) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      await apiService.auth.resetPassword({ phone, otp, newPassword });

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      const errorMessage = error.message || 'Failed to reset password';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await apiService.user.updateProfile(profileData);
      const updatedUser = response.data.user;

      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });

      return { success: true, message: SUCCESS_MESSAGES.PROFILE_UPDATED };
    } catch (error) {
      const errorMessage = error.message || 'Failed to update profile';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear stored data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if clearing storage fails, reset the state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
    token: state.token,
    error: state.error,

    // Actions
    login,
    register,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    updateProfile,
    logout,
    clearError,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};