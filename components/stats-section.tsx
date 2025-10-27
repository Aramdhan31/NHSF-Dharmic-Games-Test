"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";

interface StatsData {
  universities: number;
  sportsTeams: number;
  players: number;
  matches: number;
  completedMatches: number;
  zones: number;
}

export default function StatsSection() {
  const [stats, setStats] = useState<StatsData>({
    universities: 0,
    sportsTeams: 0,
    players: 0,
    matches: 0,
    completedMatches: 0,
    zones: 0,
  });

  useEffect(() => {
    const universitiesRef = ref(realtimeDb, "universities");
    const matchesRef = ref(realtimeDb, "matches");

    // 🔹 Listen for universities (for teams, players, zones)
    const unsubUnis = onValue(universitiesRef, (snap) => {
      const data = snap.val() || {};
      const universitiesCount = Object.keys(data).length;

      let sportsTeamsCount = 0;
      let playersCount = 0;

      Object.values(data).forEach((uni: any) => {
        // Sports registered to each university = sports teams
        if (uni.sports && Array.isArray(uni.sports)) {
          sportsTeamsCount += uni.sports.length;
        }
        
        // Count players from university
        if (uni.players && typeof uni.players === 'object') {
          playersCount += Object.keys(uni.players).length;
        }
      });

      setStats((prev) => ({
        ...prev,
        universities: universitiesCount,
        sportsTeams: sportsTeamsCount,
        players: playersCount,
        zones: zones.size,
      }));
    });

    // 🔹 Listen for matches
    const unsubMatches = onValue(matchesRef, (snap) => {
      const data = snap.val() || {};
      let totalMatches = 0;
      let completedMatches = 0;

      // matches are grouped by sport
      Object.values(data).forEach((sportMatches: any) => {
        if (typeof sportMatches === "object") {
          Object.values(sportMatches).forEach((match: any) => {
            totalMatches++;
            if (match.status === "completed") {
              completedMatches++;
            }
          });
        }
      });

      setStats((prev) => ({
        ...prev,
        matches: totalMatches || 0,
        completedMatches: completedMatches || 0,
      }));
    });

    return () => {
      unsubUnis();
      unsubMatches();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <StatCard title="Competing Universities" value={stats.universities} />
      <StatCard title="Sports Teams" value={stats.sportsTeams} />
      <StatCard title="Active Players" value={stats.players} />
      <StatCard title="Total Matches" value={stats.matches} />
      <StatCard title="Completed Matches" value={stats.completedMatches} />
      <StatCard title="Active Zones" value={stats.zones} />
    </div>
  );
}

// Reusable stat card
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-md shadow-sm p-4 border border-gray-100 flex flex-col items-center">
      <p className="text-gray-600 text-sm">{title}</p>
      <h2 className="text-3xl font-bold text-red-600 mt-1">{value}</h2>
    </div>
  );
}
