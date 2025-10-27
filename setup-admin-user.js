// Script to add admin user to Firebase Realtime Database
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// Your Firebase config (same as in lib/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyB7sBpDqo6fQoAQddZry9UyJKlK2yy6Z3k",
  authDomain: "nhsf-test.firebaseapp.com",
  databaseURL: "https://nhsf-test-default-rtdb.firebaseio.com",
  projectId: "nhsf-test",
  storageBucket: "nhsf-test.firebasestorage.app",
  messagingSenderId: "235310238787",
  appId: "1:235310238787:web:d2875c334ac783d7b618f6",
  measurementId: "G-STVX7Q1FJP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function setupAdminUser() {
  try {
    console.log('🔧 Setting up admin user...');
    
    // Add you as a superadmin
    const adminRef = ref(database, 'admins/pdevulapally');
    await set(adminRef, {
      email: 'pdevulapally0202@gmail.com',
      name: 'Preetham Devulapally',
      role: 'superadmin',
      permissions: {
        canManageAllZones: true,
        canApproveAdmins: true,
        canManageUniversities: true
      },
      createdAt: Date.now()
    });
    
    console.log('✅ Admin user setup complete!');
    console.log('📧 Email: pdevulapally0202@gmail.com');
    console.log('👑 Role: superadmin');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  }
}

setupAdminUser();
