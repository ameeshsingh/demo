import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../context/ThemeContext';
import { COLORS, UI_CONSTANTS } from '../utils/config';

const NoInternetModal = () => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsVisible(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = async () => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Card style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color: theme.colors.error }]}>
                📡
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              No Internet Connection
            </Text>

            {/* Message */}
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
              Please check your internet connection and try again. Some features may not work without an internet connection.
            </Text>

            {/* Retry Button */}
            <Button
              mode="contained"
              onPress={handleRetry}
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              contentStyle={styles.buttonContent}
            >
              Retry
            </Button>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.L,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    elevation: 8,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  cardContent: {
    paddingVertical: UI_CONSTANTS.SPACING.XL,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: UI_CONSTANTS.SPACING.L,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: UI_CONSTANTS.FONT_SIZES.L,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.M,
  },
  message: {
    fontSize: UI_CONSTANTS.FONT_SIZES.M,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: UI_CONSTANTS.SPACING.XL,
  },
  retryButton: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    minWidth: 120,
  },
  buttonContent: {
    height: UI_CONSTANTS.BUTTON_HEIGHT,
  },
});

export default NoInternetModal;