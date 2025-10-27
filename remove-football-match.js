// Simple script to remove football matches from Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, remove } = require('firebase/database');

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

async function removeFootballMatches() {
  try {
    console.log('🔍 Checking for football matches...');
    
    // Get all matches
    const matchesRef = ref(db, 'matches');
    const snapshot = await get(matchesRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No matches found in database');
      return;
    }
    
    const matches = snapshot.val();
    console.log(`📊 Found ${Object.keys(matches).length} matches in database`);
    
    // Find and delete football matches
    const footballMatches = [];
    
    Object.entries(matches).forEach(([key, match]) => {
      if (match.sport === 'Football') {
        footballMatches.push({ key, match });
        console.log(`Found football match: ${match.team1} vs ${match.team2} (${match.status})`);
      }
    });
    
    if (footballMatches.length === 0) {
      console.log('✅ No football matches found');
      return;
    }
    
    console.log(`🗑️ Found ${footballMatches.length} football matches to delete:`);
    footballMatches.forEach(({ key, match }) => {
      console.log(`  - ${match.sport}: ${match.team1} vs ${match.team2} (${match.status})`);
    });
    
    // Delete football matches
    for (const { key } of footballMatches) {
      const matchRef = ref(db, `matches/${key}`);
      await remove(matchRef);
      console.log(`✅ Deleted football match: ${key}`);
    }
    
    console.log('🎉 All football matches removed!');
    
  } catch (error) {
    console.error('❌ Error removing football matches:', error);
  }
}

// Run the script
removeFootballMatches();
