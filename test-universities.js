// Test script to check what's in Firebase Realtime Database
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB7sBpDqo6fQoAQddZry9UyJKlK2yy6Z3k",
  authDomain: "nhsf-dharmic-games.firebaseapp.com",
  databaseURL: "https://nhsf-dharmic-games-default-rtdb.firebaseio.com",
  projectId: "nhsf-dharmic-games",
  storageBucket: "nhsf-dharmic-games.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkUniversities() {
  try {
    console.log('🔍 Checking universities in Realtime Database...');
    
    // Check universities
    const universitiesRef = ref(db, 'universities');
    const universitiesSnapshot = await get(universitiesRef);
    
    if (universitiesSnapshot.exists()) {
      const universities = universitiesSnapshot.val();
      console.log('📊 Found universities in Realtime Database:', Object.keys(universities).length);
      console.log('🏫 Universities:', Object.values(universities));
    } else {
      console.log('❌ No universities found in Realtime Database');
    }
    
    // Check if there's any data at all
    const rootRef = ref(db, '/');
    const rootSnapshot = await get(rootRef);
    
    if (rootSnapshot.exists()) {
      const rootData = rootSnapshot.val();
      console.log('📊 Root data keys:', Object.keys(rootData));
    } else {
      console.log('❌ No data found in Realtime Database');
    }
    
  } catch (error) {
    console.error('❌ Error checking universities:', error);
  }
}

// Run the test
checkUniversities();
