// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

export const API_TIMEOUT = 10000; // 10 seconds

// App Configuration
export const APP_NAME = 'PayUS';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'payus_auth_token',
  USER_DATA: 'payus_user_data',
  ONBOARDING_COMPLETE: 'payus_onboarding_complete',
  NOTIFICATION_SETTINGS: 'payus_notification_settings',
  THEME_PREFERENCE: 'payus_theme_preference',
  LANGUAGE: 'payus_language',
};

// Request Status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

// Request Types
export const REQUEST_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group',
};

// Contact Tags
export const CONTACT_TAGS = {
  FRIEND: 'friend',
  FAMILY: 'family',
  COLLEAGUE: 'colleague',
  OTHER: 'other',
};

// Request Priority
export const REQUEST_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Request Tags
export const REQUEST_TAGS = {
  EMERGENCY: 'emergency',
  MEDICAL: 'medical',
  TRAVEL: 'travel',
  EDUCATION: 'education',
  BUSINESS: 'business',
  PERSONAL: 'personal',
  OTHER: 'other',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_REQUEST: 'new_request',
  REQUEST_ACCEPTED: 'request_accepted',
  REQUEST_REJECTED: 'request_rejected',
  PAYMENT_RECEIVED: 'payment_received',
  REMINDER: 'reminder',
};

// Reminder Frequency
export const REMINDER_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  THREE_DAYS_BEFORE: '3days_before',
};

// Validation Rules
export const VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  AMOUNT_MIN: 1,
  AMOUNT_MAX: 100000,
  DESCRIPTION_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 200,
  MESSAGE_MAX_LENGTH: 200,
};

// UI Constants
export const UI_CONSTANTS = {
  BORDER_RADIUS: 12,
  CARD_ELEVATION: 2,
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  SPACING: {
    XS: 4,
    S: 8,
    M: 16,
    L: 24,
    XL: 32,
    XXL: 48,
  },
  FONT_SIZES: {
    XS: 12,
    S: 14,
    M: 16,
    L: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid email/phone or password.',
  USER_NOT_FOUND: 'User not found.',
  INVALID_OTP: 'Invalid OTP. Please try again.',
  EXPIRED_OTP: 'OTP has expired. Please request a new one.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters.`,
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters.`,
  NAME_TOO_LONG: `Name cannot be more than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters.`,
  AMOUNT_TOO_LOW: `Amount must be at least ₹${VALIDATION_RULES.AMOUNT_MIN}.`,
  AMOUNT_TOO_HIGH: `Amount cannot exceed ₹${VALIDATION_RULES.AMOUNT_MAX.toLocaleString()}.`,
  INVALID_DATE: 'Please select a valid date.',
  PAST_DATE: 'Date cannot be in the past.',
  CONTACT_NOT_FOUND: 'Contact not found.',
  REQUEST_NOT_FOUND: 'Request not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  PERMISSION_DENIED: 'Permission denied.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  OTP_SENT: 'OTP sent successfully!',
  OTP_VERIFIED: 'OTP verified successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  CONTACT_ADDED: 'Contact added successfully!',
  CONTACT_UPDATED: 'Contact updated successfully!',
  CONTACT_DELETED: 'Contact deleted successfully!',
  REQUEST_CREATED: 'Request created successfully!',
  REQUEST_UPDATED: 'Request updated successfully!',
  REQUEST_CANCELLED: 'Request cancelled successfully!',
  PAYMENT_RECORDED: 'Payment recorded successfully!',
  SETTINGS_UPDATED: 'Settings updated successfully!',
};

// Colors
export const COLORS = {
  PRIMARY: '#2563EB',
  PRIMARY_DARK: '#1D4ED8',
  PRIMARY_LIGHT: '#DBEAFE',
  ACCENT: '#10B981',
  ACCENT_DARK: '#059669',
  ACCENT_LIGHT: '#D1FAE5',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  BACKGROUND: '#F8FAFC',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_DISABLED: '#9CA3AF',
  BORDER: '#E5E7EB',
  SHADOW: '#000000',
  OVERLAY: '#00000080',
  GRADIENT_START: '#2563EB',
  GRADIENT_END: '#1D4ED8',
};

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  ME: '/auth/me',
  
  // User
  PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  NOTIFICATION_SETTINGS: '/user/notification-settings',
  CHANGE_PASSWORD: '/user/password',
  DEACTIVATE_ACCOUNT: '/user/account',
  STATISTICS: '/user/statistics',
  SEARCH_USERS: '/user/search',
  
  // Contacts
  CONTACTS: '/contact',
  ADD_CONTACT: '/contact',
  IMPORT_CONTACTS: '/contact/import',
  CONTACT_DETAIL: '/contact',
  UPDATE_CONTACT: '/contact',
  DELETE_CONTACT: '/contact',
  ADD_TAG: '/contact',
  REMOVE_TAG: '/contact',
  
  // Requests
  REQUESTS: '/request',
  CREATE_REQUEST: '/request',
  REQUEST_DETAIL: '/request',
  UPDATE_REQUEST_STATUS: '/request',
  ADD_MESSAGE: '/request',
  CANCEL_REQUEST: '/request',
  PENDING_COUNT: '/request/pending/count',
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};