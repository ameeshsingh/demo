import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text, Card, Button, Chip, FAB, Avatar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiService from '../services/api';
import { COLORS, UI_CONSTANTS, REQUEST_STATUS, REQUEST_PRIORITY } from '../utils/config';
import Toast from 'react-native-toast-message';
import moment from 'moment';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [statistics, setStatistics] = useState({
    pendingSent: 0,
    pendingReceived: 0,
    totalPending: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [requestsResponse, statsResponse] = await Promise.all([
        apiService.requests.getAll({ status: 'pending', limit: 10 }),
        apiService.requests.getPendingCount(),
      ]);

      setPendingRequests(requestsResponse.data.requests || []);
      setStatistics(statsResponse.data);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load dashboard data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case REQUEST_STATUS.PENDING:
        return COLORS.WARNING;
      case REQUEST_STATUS.ACCEPTED:
        return COLORS.INFO;
      case REQUEST_STATUS.PARTIALLY_PAID:
        return COLORS.ACCENT;
      case REQUEST_STATUS.PAID:
        return COLORS.SUCCESS;
      case REQUEST_STATUS.REJECTED:
        return COLORS.ERROR;
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case REQUEST_PRIORITY.LOW:
        return COLORS.SUCCESS;
      case REQUEST_PRIORITY.MEDIUM:
        return COLORS.WARNING;
      case REQUEST_PRIORITY.HIGH:
        return COLORS.ERROR;
      case REQUEST_PRIORITY.URGENT:
        return '#DC2626';
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  // Format amount
  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };

  // Handle request press
  const handleRequestPress = (request) => {
    navigation.navigate('RequestDetail', { requestId: request._id });
  };

  // Handle create request
  const handleCreateRequest = () => {
    navigation.navigate('CreateRequest');
  };

  // Handle view all requests
  const handleViewAllRequests = () => {
    navigation.navigate('Requests');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>
                Hello, {user?.name || 'User'}!
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Manage your informal money requests
              </Text>
            </View>
            <Avatar.Text
              size={50}
              label={user?.name?.charAt(0)?.toUpperCase() || 'U'}
              style={{ backgroundColor: theme.colors.primary }}
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {statistics.pendingSent}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Sent Requests
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, { color: theme.colors.accent }]}>
                {statistics.pendingReceived}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Received Requests
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Quick Actions
            </Text>
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                onPress={handleCreateRequest}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                icon="plus"
              >
                New Request
              </Button>
              <Button
                mode="outlined"
                onPress={handleViewAllRequests}
                style={styles.actionButton}
                icon="list"
              >
                View All
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Pending Requests */}
        <Card style={[styles.requestsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Pending Requests
              </Text>
              {statistics.totalPending > 0 && (
                <Chip
                  mode="outlined"
                  textStyle={{ color: theme.colors.primary }}
                  style={{ borderColor: theme.colors.primary }}
                >
                  {statistics.totalPending}
                </Chip>
              )}
            </View>

            {pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No pending requests
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Create a new request or check your contacts
                </Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {pendingRequests.map((request, index) => (
                  <View key={request._id}>
                    <Card
                      style={[styles.requestCard, { backgroundColor: theme.colors.background }]}
                      onPress={() => handleRequestPress(request)}
                    >
                      <Card.Content style={styles.requestContent}>
                        <View style={styles.requestHeader}>
                          <View style={styles.requestInfo}>
                            <Text style={[styles.requestTitle, { color: theme.colors.textPrimary }]}>
                              {request.title}
                            </Text>
                            <Text style={[styles.requestAmount, { color: theme.colors.primary }]}>
                              {formatAmount(request.totalAmount)}
                            </Text>
                          </View>
                          <View style={styles.requestMeta}>
                            <Chip
                              mode="outlined"
                              textStyle={{ color: getStatusColor(request.status) }}
                              style={{ borderColor: getStatusColor(request.status) }}
                              compact
                            >
                              {request.status}
                            </Chip>
                            {request.priority !== REQUEST_PRIORITY.MEDIUM && (
                              <Chip
                                mode="outlined"
                                textStyle={{ color: getPriorityColor(request.priority) }}
                                style={{ 
                                  borderColor: getPriorityColor(request.priority),
                                  marginTop: 4,
                                }}
                                compact
                              >
                                {request.priority}
                              </Chip>
                            )}
                          </View>
                        </View>

                        <View style={styles.requestDetails}>
                          <Text style={[styles.requestDetail, { color: theme.colors.textSecondary }]}>
                            Due: {formatDate(request.repaymentDate)}
                          </Text>
                          <Text style={[styles.requestDetail, { color: theme.colors.textSecondary }]}>
                            {request.isCreator ? 'Sent to' : 'From'}: {request.isCreator ? request.recipients[0]?.name : request.creator?.name}
                          </Text>
                        </View>
                      </Card.Content>
                    </Card>
                    {index < pendingRequests.length - 1 && <Divider style={styles.divider} />}
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB for quick actions */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateRequest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: UI_CONSTANTS.SPACING.L,
    paddingVertical: UI_CONSTANTS.SPACING.L,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XL,
    fontWeight: 'bold',
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  subtitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.M,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: UI_CONSTANTS.SPACING.L,
    marginBottom: UI_CONSTANTS.SPACING.L,
  },
  statCard: {
    flex: 1,
    marginHorizontal: UI_CONSTANTS.SPACING.S,
    elevation: UI_CONSTANTS.CARD_ELEVATION,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.M,
  },
  statNumber: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XXL,
    fontWeight: 'bold',
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  statLabel: {
    fontSize: UI_CONSTANTS.FONT_SIZES.S,
    textAlign: 'center',
  },
  actionsCard: {
    marginHorizontal: UI_CONSTANTS.SPACING.L,
    marginBottom: UI_CONSTANTS.SPACING.L,
    elevation: UI_CONSTANTS.CARD_ELEVATION,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: UI_CONSTANTS.SPACING.M,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: UI_CONSTANTS.SPACING.S,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  requestsCard: {
    marginHorizontal: UI_CONSTANTS.SPACING.L,
    marginBottom: UI_CONSTANTS.SPACING.L,
    elevation: UI_CONSTANTS.CARD_ELEVATION,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.M,
  },
  sectionTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.L,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XL,
  },
  emptyText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.M,
    marginBottom: UI_CONSTANTS.SPACING.S,
  },
  emptySubtext: {
    fontSize: UI_CONSTANTS.FONT_SIZES.S,
    textAlign: 'center',
  },
  requestsList: {
    marginTop: UI_CONSTANTS.SPACING.M,
  },
  requestCard: {
    marginBottom: UI_CONSTANTS.SPACING.S,
    elevation: 1,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  requestContent: {
    paddingVertical: UI_CONSTANTS.SPACING.M,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: UI_CONSTANTS.SPACING.S,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: UI_CONSTANTS.FONT_SIZES.M,
    fontWeight: '600',
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  requestAmount: {
    fontSize: UI_CONSTANTS.FONT_SIZES.L,
    fontWeight: 'bold',
  },
  requestMeta: {
    alignItems: 'flex-end',
  },
  requestDetails: {
    marginTop: UI_CONSTANTS.SPACING.S,
  },
  requestDetail: {
    fontSize: UI_CONSTANTS.FONT_SIZES.S,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },
  divider: {
    marginVertical: UI_CONSTANTS.SPACING.S,
  },
  fab: {
    position: 'absolute',
    margin: UI_CONSTANTS.SPACING.L,
    right: 0,
    bottom: 0,
  },
});

export default DashboardScreen;