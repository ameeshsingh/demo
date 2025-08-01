import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { COLORS, UI_CONSTANTS } from '../utils/config';

const CustomTabBar = ({ navigation, state, descriptors }) => {
  const { theme } = useTheme();

  const renderIcon = ({ route, focused, color }) => {
    const { options } = descriptors[route.key];
    const iconName = options.tabBarIcon || 'circle';
    
    return (
      <BottomNavigation.Icon
        icon={iconName}
        color={color}
        size={24}
      />
    );
  };

  const renderScene = BottomNavigation.SceneMap({
    Dashboard: () => null,
    CreateRequest: () => null,
    Contacts: () => null,
    Settings: () => null,
  });

  return (
    <BottomNavigation
      navigationState={state}
      onIndexChange={(index) => {
        const route = state.routes[index];
        navigation.navigate(route.name);
      }}
      renderScene={renderScene}
      renderIcon={renderIcon}
      barStyle={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.textDisabled}
      sceneAnimationEnabled={true}
      sceneAnimationType="shifting"
      shifting={false}
      compact={false}
      safeAreaInsets={{ bottom: 0 }}
    />
  );
};

const styles = StyleSheet.create({
  tabBar: {
    elevation: 8,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
});

export default CustomTabBar;