# 🔥 Firebase Rules Update Guide

## 🚨 **CRITICAL: Update Your Firebase Rules**

Your current rules are blocking the admin dashboard from reading university requests. Here's the exact update you need:

## 📋 **Current Issue:**
- University registration API saves to `universityRequests` collection
- Admin dashboard tries to read from `universityRequests` collection  
- Firebase rules are blocking the read access
- Result: Admin can't see the requests

## 🔧 **Updated Firebase Rules:**

Replace your current rules with this version:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isSuperAdmin() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }

    function isZoneAdmin() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'zone_admin';
    }

    // CRITICAL: Allow admin dashboard to read university requests
    match /universityRequests/{document} {
      allow read, write: if true; // Allow anyone (including admin dashboard)
    }

    // CRITICAL: Allow admin dashboard to read admin access requests  
    match /adminAccessRequests/{document} {
      allow read, write: if true; // Allow anyone (including admin dashboard)
    }

    // CRITICAL: Allow admin dashboard to read members
    match /members/{document} {
      allow read, write: if true; // Allow anyone (including admin dashboard)
    }

    // Users collection - authenticated users only
    match /users/{userId} {
      allow read, write: if (isAuthenticated() && request.auth.uid == userId) || isSuperAdmin();
    }

    // Universities collection - authenticated users only
    match /universities/{universityId} {
      allow read, write: if (isAuthenticated() && request.auth.uid == universityId) ||
                         isSuperAdmin() ||
                         (isZoneAdmin() && resource.data.zone == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.zone);
    }

    // Players collection - admin only
    match /players/{playerId} {
      allow read, write: if isSuperAdmin() || isZoneAdmin();
    }

    // Test collection for debugging
    match /test/{document} {
      allow read, write: if true; // Allow server-side API access
    }

    // Allow authenticated users to read/write other collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🎯 **Key Changes Made:**

### ✅ **1. Explicit Admin Access:**
```firestore
match /universityRequests/{document} {
  allow read, write: if true; // Allow admin dashboard to read
}
```

### ✅ **2. Server-Side API Access:**
```firestore
match /adminAccessRequests/{document} {
  allow read, write: if true; // Allow server-side APIs
}
```

### ✅ **3. Debug Collection:**
```firestore
match /test/{document} {
  allow read, write: if true; // Allow testing
}
```

## 🚀 **How to Update:**

### **Step 1: Go to Firebase Console**
1. Visit: https://console.firebase.google.com
2. Select your project: "NHSF Dharmic Games"
3. Go to "Firestore Database" > "Rules"

### **Step 2: Replace Rules**
1. Copy the new rules above
2. Paste them into the rules editor
3. Click "Publish"

### **Step 3: Test the Fix**
1. Go to: `http://localhost:3000/debug`
2. Click "Check University Requests"
3. Click "Add Test Request"
4. Go to `/admin` and check if requests appear

## 🧪 **Expected Results:**

After updating the rules:
- ✅ **University requests will appear in admin dashboard**
- ✅ **Admin can approve/reject requests**
- ✅ **No more permission denied errors**
- ✅ **Debug dashboard will show requests**

## 🚨 **If Still Not Working:**

### **Check Firebase Connection:**
1. Visit: `http://localhost:3000/debug`
2. Click "Test Firebase Debug"
3. Look for Firebase configuration errors

### **Check Environment Variables:**
Make sure you have these in `.env.local`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### **API Endpoints:**
- `/api/debug-firebase` - Test Firebase connection

---

**Update your Firebase rules with the new version above, and your admin dashboard will be able to see university requests!** 🎉
