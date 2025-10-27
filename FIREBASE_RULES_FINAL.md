# 🔥 Final Firebase Rules - Copy This Exactly

## 🚨 **CRITICAL: Replace Your Current Rules With This**

Copy and paste this **exact** code into your Firebase Console Rules:

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

    // CRITICAL: Allow university registration API to save requests
    match /universityRequests/{document} {
      allow read, write: if true; // Allow anyone (including server-side APIs and admin dashboard)
    }

    // CRITICAL: Allow admin access requests (already working)
    match /adminAccessRequests/{document} {
      allow read, write: if true; // Allow anyone (including server-side APIs and admin dashboard)
    }

    // CRITICAL: Allow member registrations
    match /members/{document} {
      allow read, write: if true; // Allow anyone (including server-side APIs and admin dashboard)
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

### ✅ **1. Explicit University Requests Access:**
```firestore
match /universityRequests/{document} {
  allow read, write: if true; // Allow anyone (including server-side APIs and admin dashboard)
}
```

### ✅ **2. Admin Access Requests (Already Working):**
```firestore
match /adminAccessRequests/{document} {
  allow read, write: if true; // Allow anyone (including server-side APIs and admin dashboard)
}
```

### ✅ **3. Members Collection:**
```firestore
match /members/{document} {
  allow read, write: if true; // Allow anyone (including server-side APIs and admin dashboard)
}
```

## 🚀 **How to Update:**

### **Step 1: Go to Firebase Console**
1. Visit: https://console.firebase.google.com
2. Select your "NHSF Dharmic Games" project
3. Go to "Firestore Database" > "Rules"

### **Step 2: Replace Rules**
1. **Delete all existing rules**
2. **Copy the rules above**
3. **Paste them into the rules editor**
4. **Click "Publish"**

### **Step 3: Test**
1. **Submit a university registration**
2. **Go to admin dashboard**
3. **Check if request appears**

## 🧪 **Expected Results:**

After updating the rules:
- ✅ **University registration API** can save to `universityRequests`
- ✅ **Admin dashboard** can read from `universityRequests`
- ✅ **University requests** appear in admin dashboard
- ✅ **No more permission errors**

## 🚨 **If Still Not Working:**

### **Check These:**
1. **Firebase Project ID** - Make sure you're using the right project
2. **Collection Name** - Should be `universityRequests` (exact spelling)
3. **Admin Dashboard** - Refresh the page after updating rules
4. **API Logs** - Check Vercel logs for any errors

---

**Copy these rules exactly and publish them - your university requests will appear in the admin dashboard!** 🎉
