# Firebase Rules Deployment Guide

## Overview
This guide explains how to deploy the updated Firebase security rules to handle the new username functionality and proper access control.

## Files Created

### 1. `firestore.rules`
- **Purpose**: Firestore database security rules
- **Key Features**:
  - Role-based access control (super_admin, zone_admin, university)
  - Username field support in universities collection
  - Public read access for live matches and statistics
  - Secure admin-only access for sensitive operations

### 2. `database.rules.json`
- **Purpose**: Firebase Realtime Database security rules
- **Key Features**:
  - Zone-based data access control
  - Public read access for live data (matches, leaderboard, stats)
  - Admin-only write access for live match updates
  - University-specific data access

### 3. `firebase.json`
- **Purpose**: Firebase project configuration
- **Includes**: Rules paths, hosting config, build settings

### 4. `firestore.indexes.json`
- **Purpose**: Firestore database indexes for optimal query performance
- **Key Indexes**:
  - Username lookups in universities collection
  - Zone and status filtering
  - Date-based sorting for requests

## Deployment Steps

### Prerequisites
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase project (if not already done):
   ```bash
   firebase init
   ```

### Deploy Rules

1. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Realtime Database Rules**:
   ```bash
   firebase deploy --only database
   ```

3. **Deploy Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Deploy Everything**:
   ```bash
   firebase deploy
   ```

## Key Security Features

### Access Control Levels

1. **Super Admin** (`super_admin`):
   - Full access to all collections
   - Can manage all zones
   - Can approve/reject requests

2. **Zone Admin** (`zone_admin`):
   - Access to assigned zone(s) only
   - Can manage universities in their zone
   - Can update live matches

3. **University** (`university`):
   - Access to their own university data only
   - Can manage their players and teams
   - Cannot access other universities' data

4. **Public Access**:
   - Live matches (read-only)
   - Leaderboard (read-only)
   - Statistics (read-only)

### Username Support

- Universities can be looked up by username
- Username field is indexed for fast queries
- Username uniqueness is enforced at application level
- Login system supports both email and username

### Data Protection

- All sensitive operations require authentication
- Zone-based access control prevents cross-zone data access
- University data is isolated by user ID
- Admin requests are protected from unauthorized access

## Testing Rules

### Test Firestore Rules
```bash
firebase firestore:rules:test
```

### Test Realtime Database Rules
```bash
firebase database:rules:test
```

## Monitoring

After deployment, monitor the Firebase Console for:
- Rule violations in the console logs
- Performance metrics for queries
- Security alerts

## Rollback

If issues occur, rollback to previous rules:
```bash
firebase firestore:rules:rollback
firebase database:rules:rollback
```

## Important Notes

1. **Username Uniqueness**: The rules don't enforce username uniqueness - this is handled at the application level during registration.

2. **Public Data**: Live matches, leaderboard, and statistics are publicly readable for real-time updates on the website.

3. **Zone Access**: Zone admins can only access data for their assigned zone(s). Super admins can access all zones.

4. **University Isolation**: Each university can only access their own data, preventing cross-university data leaks.

5. **Request Processing**: Admin and university requests can be created without authentication but require admin approval.

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Verify user roles are correctly set
3. Test rules in Firebase Console simulator
4. Review this guide for proper configuration
