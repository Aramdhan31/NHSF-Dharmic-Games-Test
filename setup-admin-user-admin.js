// Script to add admin user using Firebase Admin SDK
const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// Your Firebase config
const firebaseConfig = {
  projectId: "nhsf-test",
  databaseURL: "https://nhsf-test-default-rtdb.firebaseio.com"
};

// Initialize Firebase Admin
const app = initializeApp({
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL
});

const database = getDatabase(app);

async function setupAdminUser() {
  try {
    console.log('🔧 Setting up admin user with Admin SDK...');
    
    // Add you as a superadmin
    const adminRef = database.ref('admins/pdevulapally');
    await adminRef.set({
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
