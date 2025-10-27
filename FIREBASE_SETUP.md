# 🔥 Firebase Setup Guide

## 🚨 **CRITICAL: Fix the 500 API Error**

The university registration API is failing because Firebase Admin SDK is not properly configured.

### **Option 1: Quick Fix (Recommended for Development)**

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project:**
   ```bash
   firebase init
   ```
   - Select "Firestore" and "Hosting"
   - Choose your existing project or create a new one

4. **Set up Application Default Credentials:**
   ```bash
   firebase use --add
   ```

### **Option 2: Environment Variables (Production)**

Create a `.env.local` file in your project root:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Optional
NEXT_PUBLIC_SITE_URL=https://nhsf-dharmic-games.vercel.app
```

### **Option 3: Service Account Key (Alternative)**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to "Project Settings" > "Service Accounts"
4. Click "Generate new private key"
5. Download the JSON file
6. Extract the values and add to `.env.local`

## 🔧 **Test Firebase Connection**

After setup, test the connection:

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the API:**
   - Visit: `http://localhost:3000/api/test-firebase`
   - Should return: `{"success": true, "message": "Firebase connection successful"}`

3. **University Registration:**
   - Try registering a university
   - Check browser console for detailed error messages

## 🚨 **Fix the Deprecated Meta Tag**

The `apple-mobile-web-app-capable` warning is likely from:
1. **Browser cache** - Clear your browser cache
2. **Browser extension** - Disable extensions temporarily
3. **Cached service worker** - Clear application data

### **Steps to Fix:**
1. **Clear Browser Cache:**
   - Chrome: Ctrl+Shift+Delete
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard Refresh:**
   - Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)

3. **Check Developer Tools:**
   - Open DevTools (F12)
   - Go to "Application" tab
   - Clear "Storage" > "Clear storage"

## ✅ **Verification Steps**

### **1. Check Firebase Connection:**
```bash
# Test the API endpoint
curl http://localhost:3000/api/test-firebase
```

### **2. Check Meta Tags:**
- Open DevTools (F12)
- Go to "Elements" tab
- Search for "apple-mobile-web-app-capable"
- Should NOT find the deprecated tag

### **3. University Registration:**
- Go to `/register` page
- Fill out the form
- Submit and check for errors

## 🎯 **Expected Results**

After fixing Firebase:
- ✅ API returns 200 status
- ✅ University registration works
- ✅ No more 500 errors
- ✅ No deprecation warnings

## 🆘 **Still Having Issues?**

If you're still getting errors:

1. **Check Firebase Project:**
   - Ensure your Firebase project exists
   - Check Firestore is enabled
   - Verify security rules allow writes

2. **Check Environment Variables:**
   - Ensure `.env.local` is in project root
   - Restart development server after adding env vars
   - Check variables are properly formatted

3. **Check Console Logs:**
   - Look for Firebase initialization messages
   - Check for permission errors
   - Verify project ID matches

---

**Once Firebase is properly configured, your university registration will work perfectly!** 🚀
