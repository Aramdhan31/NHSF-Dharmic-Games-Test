/**
 * 🏆 NHSF Live Stats Cloud Function
 * 
 * Automatically recalculates stats and leaderboard when data changes
 * Runs as admin with full permissions - no client auth issues!
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin (has full permissions)
admin.initializeApp();

/**
 * 🔥 Auto-recalculate stats when any data changes
 */
exports.autoRecalculateStats = functions.database
  .ref("/{path=**}")
  .onWrite(async (change, context) => {
    console.log("🔄 NHSF data changed, recalculating stats...");
    
    try {
      const db = admin.database();
      
      // Get all current data
      const [unisSnap, matchesSnap, playersSnap] = await Promise.all([
        db.ref("universities").once("value"),
        db.ref("matches").once("value"),
        db.ref("players").once("value"),
      ]);

      const universities = unisSnap.val() || {};
      const matches = matchesSnap.val() || {};
      const players = playersSnap.val() || {};

      console.log("📊 Data counts:", {
        universities: Object.keys(universities).length,
        matches: Object.keys(matches).length,
        players: Object.keys(players).length
      });

      // Calculate NHSF-specific stats
      const stats = calculateNHSFStats(universities, matches, players);
      const leaderboard = calculateNHSFLeaderboard(universities, matches);

      // Update Firebase with admin permissions
      await Promise.all([
        db.ref("stats/summary").set({
          ...stats,
          lastUpdated: Date.now(),
          isLive: true,
          calculatedBy: "cloud-function"
        }),
        db.ref("stats/leaderboard").set({
          ...leaderboard,
          lastUpdated: Date.now(),
          isLive: true,
          calculatedBy: "cloud-function"
        })
      ]);

      console.log("✅ NHSF stats updated successfully:", stats);
      console.log("✅ NHSF leaderboard updated successfully");
      
      return { success: true, stats, leaderboard };
    } catch (error) {
      console.error("❌ Error updating NHSF stats:", error);
      throw error;
    }
  });

/**
 * 🏫 Calculate NHSF-specific stats
 */
function calculateNHSFStats(universities, matches, players) {
  const uniList = Object.values(universities || {});
  
  // ✅ Only count universities that are actually competing (same logic as league table)
  const competingUnis = uniList.filter(uni => 
    uni.isCompeting === true || 
    uni.status === 'competing' ||
    (uni.status !== 'not-competing' && uni.status !== 'affiliated')
  );

  const totalUniversities = competingUnis.length;

  let totalPoints = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalDraws = 0;

  // Count stats only for competing unis
  competingUnis.forEach(uni => {
    totalPoints += uni.points || 0;
    totalWins += uni.wins || 0;
    totalLosses += uni.losses || 0;
    totalDraws += uni.draws || 0;
  });

  // Count only matches that involve competing universities
  const totalMatches = Object.values(matches || {}).filter(match => {
    return match?.status === "completed" &&
      competingUnis.some(uni => uni.id === match.teamA || uni.id === match.teamB);
  }).length;

  return {
    totalUniversities,
    competingUniversities: totalUniversities,
    totalPoints,
    totalWins,
    totalLosses,
    totalDraws,
    totalMatches,
    lastCalculated: Date.now(),
  };
}

/**
 * 🏆 Calculate NHSF leaderboard
 */
function calculateNHSFLeaderboard(universities, matches) {
  const uniList = Object.values(universities);
  
  // Calculate points for each university (only include competing ones)
  const leaderboard = uniList
    .filter(uni => {
      // Only include universities that are actively competing
      return (uni.isCompeting === true) || 
             (uni.status === 'competing') ||
             (uni.status !== 'not-competing' && uni.status !== 'affiliated');
    })
    .map(uni => {
    const wins = uni.wins || 0;
    const losses = uni.losses || 0;
    const draws = uni.draws || 0;
    const points = uni.points || 0;
    const totalMatches = wins + losses + draws;

    return {
      id: uni.id,
      name: uni.name || uni.universityName,
      zone: uni.zone || uni.region,
      sports: uni.sports || [],
      wins,
      losses,
      draws,
      points,
      totalMatches,
      isCompeting: uni.isCompeting || uni.status === 'competing',
      lastUpdated: uni.lastUpdated || Date.now()
    };
  });

  // Sort by points (descending), then alphabetically
  leaderboard.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.name.localeCompare(b.name);
  });

  // Add positions
  leaderboard.forEach((entry, index) => {
    entry.position = index + 1;
  });

  return {
    entries: leaderboard,
    lastUpdated: Date.now(),
    isLive: true
  };
}

/**
 * 🎯 Manual trigger for stats recalculation
 */
exports.manualRecalculateStats = functions.https.onCall(async (data, context) => {
  console.log("🎯 Manual stats recalculation triggered");
  
  try {
    const db = admin.database();
    
    // Get all current data
    const [unisSnap, matchesSnap, playersSnap] = await Promise.all([
      db.ref("universities").once("value"),
      db.ref("matches").once("value"),
      db.ref("players").once("value"),
    ]);

    const universities = unisSnap.val() || {};
    const matches = matchesSnap.val() || {};
    const players = playersSnap.val() || {};

    // Calculate stats
    const stats = calculateNHSFStats(universities, matches, players);
    const leaderboard = calculateNHSFLeaderboard(universities, matches);

    // Update Firebase
    await Promise.all([
      db.ref("stats/summary").set({
        ...stats,
        lastUpdated: Date.now(),
        isLive: true,
        calculatedBy: "manual-trigger"
      }),
      db.ref("stats/leaderboard").set({
        ...leaderboard,
        lastUpdated: Date.now(),
        isLive: true,
        calculatedBy: "manual-trigger"
      })
    ]);

    console.log("✅ Manual stats recalculation completed");
    return { success: true, stats, leaderboard };
  } catch (error) {
    console.error("❌ Error in manual recalculation:", error);
    throw new functions.https.HttpsError('internal', 'Failed to recalculate stats');
  }
});
