# PayUS - Informal Money Request Platform

A mobile application for managing informal requests for money among friends and family, designed to reduce awkwardness and social friction around borrowing/lending.

## Overview

PayUS is a social utility app that helps users send discrete, structured, and friendly requests for small sums, track repayments, and automate politeness through reminders and informal notes. The app does NOT process payments, facilitate loans, calculate interest, or create legal agreements.

## Features

- **User Authentication**: Phone/email signup with OTP verification
- **Contact Management**: Import contacts with tagging (friend/family/colleague)
- **Request Management**: Create, track, and manage money requests
- **Dashboard**: View pending requests, sent/received requests with status tracking
- **Reminders**: Automated friendly reminders for repayments
- **Privacy-First**: Minimal data storage with end-to-end encryption

## Tech Stack

- **Frontend**: React Native (iOS & Android)
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT with OTP verification

## Project Structure

```
payus/
├── mobile/          # React Native app
├── backend/         # Node.js server
├── docs/           # Documentation
└── README.md       # This file
```

## Setup Instructions

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Mobile App Setup
```bash
cd mobile
npm install
npx react-native run-android  # For Android
npx react-native run-ios      # For iOS
```

## Important Notes

- No payment processing or financial transactions within the app
- No interest calculation or legal agreements
- All money movement happens outside the app
- Privacy-first approach with minimal data collection
