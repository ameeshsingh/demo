import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, UI_CONSTANTS, VALIDATION_RULES, ERROR_MESSAGES } from '../../utils/config';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, isLoading, error, clearError } = useAuth();
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    clearError();
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (!formData.password.trim()) {
      newErrors.password = ERROR_MESSAGES.REQUIRED_FIELD;
    } else if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      newErrors.password = ERROR_MESSAGES.PASSWORD_TOO_SHORT;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const result = await login(formData);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: result.message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Login failed',
      });
    }
  };

  // Navigate to register
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  // Navigate to forgot password
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Sign in to your PayUS account
          </Text>
        </View>

        {/* Login Form */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            {/* Email/Phone Input */}
            <TextInput
              label="Email or Phone Number"
              value={formData.identifier}
              onChangeText={(value) => handleInputChange('identifier', value)}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={!!errors.identifier}
              disabled={isLoading}
            />
            <HelperText type="error" visible={!!errors.identifier}>
              {errors.identifier}
            </HelperText>

            {/* Password Input */}
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!errors.password}
              disabled={isLoading}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            {/* Forgot Password Link */}
            <Button
              mode="text"
              onPress={handleForgotPassword}
              style={styles.forgotPasswordButton}
              disabled={isLoading}
            >
              Forgot Password?
            </Button>

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              loading={isLoading}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            {/* Error Message */}
            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}
          </Card.Content>
        </Card>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: theme.colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <Button
            mode="text"
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.registerButton}
          >
            Sign Up
          </Button>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyContainer}>
          <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: UI_CONSTANTS.SPACING.L,
    paddingVertical: UI_CONSTANTS.SPACING.XL,
  },
  header: {
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.XL,
    marginTop: UI_CONSTANTS.SPACING.XXL,
  },
  title: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XXL,
    fontWeight: 'bold',
    marginBottom: UI_CONSTANTS.SPACING.S,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.M,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginBottom: UI_CONSTANTS.SPACING.L,
    elevation: UI_CONSTANTS.CARD_ELEVATION,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  cardContent: {
    paddingVertical: UI_CONSTANTS.SPACING.L,
  },
  input: {
    marginBottom: UI_CONSTANTS.SPACING.S,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: UI_CONSTANTS.SPACING.L,
  },
  loginButton: {
    marginBottom: UI_CONSTANTS.SPACING.M,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  buttonContent: {
    height: UI_CONSTANTS.BUTTON_HEIGHT,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.L,
  },
  registerText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.M,
  },
  registerButton: {
    marginLeft: -UI_CONSTANTS.SPACING.S,
  },
  privacyContainer: {
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.M,
  },
  privacyText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XS,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;