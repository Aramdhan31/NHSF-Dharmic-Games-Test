// Script to clear dummy matches from Firebase
// Run this with: node clear-dummy-matches.js

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, remove } = require('firebase/database');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
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

async function clearDummyMatches() {
  try {
    console.log('🔍 Checking for dummy matches...');
    
    // Get all matches
    const matchesRef = ref(db, 'matches');
    const snapshot = await get(matchesRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No matches found in database');
      return;
    }
    
    const matches = snapshot.val();
    console.log(`📊 Found ${Object.keys(matches).length} matches in database`);
    
    // Check for dummy matches (you can customize this logic)
    const dummyMatches = [];
    
    Object.entries(matches).forEach(([key, match]) => {
      // Look for matches that look like dummy data
      if (
        match.sport === 'Football' && 
        (!match.team1 || !match.team2 || match.team1 === 'Team 1' || match.team2 === 'Team 2')
      ) {
        dummyMatches.push({ key, match });
      }
    });
    
    if (dummyMatches.length === 0) {
      console.log('✅ No dummy matches found');
      return;
    }
    
    console.log(`🗑️ Found ${dummyMatches.length} dummy matches to delete:`);
    dummyMatches.forEach(({ key, match }) => {
      console.log(`  - ${match.sport}: ${match.team1} vs ${match.team2} (${match.status})`);
    });
    
    // Delete dummy matches
    for (const { key } of dummyMatches) {
      const matchRef = ref(db, `matches/${key}`);
      await remove(matchRef);
      console.log(`✅ Deleted dummy match: ${key}`);
    }
    
    console.log('🎉 All dummy matches cleared!');
    
  } catch (error) {
    console.error('❌ Error clearing dummy matches:', error);
  }
}

// Run the script
clearDummyMatches();
