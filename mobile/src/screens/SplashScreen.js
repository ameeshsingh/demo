import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, UI_CONSTANTS } from '../utils/config';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  useEffect(() => {
    // Set status bar style for splash screen
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(COLORS.PRIMARY);
  }, []);

  return (
    <LinearGradient
      colors={[COLORS.GRADIENT_START, COLORS.GRADIENT_END]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>₹</Text>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>PayUS</Text>
        
        {/* Tagline */}
        <Text style={styles.tagline}>
          Informal Money Requests Made Simple
        </Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Secure • Private • Friendly
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },
  logoContainer: {
    marginBottom: UI_CONSTANTS.SPACING.XL,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: UI_CONSTANTS.SPACING.S,
    textAlign: 'center',
  },
  tagline: {
    fontSize: UI_CONSTANTS.FONT_SIZES.M,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.XXL,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  footer: {
    paddingBottom: UI_CONSTANTS.SPACING.XL,
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },
  footerText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.S,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

export default SplashScreen;