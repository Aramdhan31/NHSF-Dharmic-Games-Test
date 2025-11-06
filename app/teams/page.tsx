"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { UniversityCard } from "@/components/university-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Trophy, Target, Zap, Calendar, Filter, MapPin, Plus, Loader2, User, Gamepad2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { ref, set, get } from "firebase/database"
import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore"
import { auth, realtimeDb, db } from "@/lib/firebase"
import { updateUniversityStatus } from "@/utils/updateUniversity"

// ======================
// SPORTS CONFIGURATION
// ======================
export const sportsConfig = {
  "Kho Kho": {
    price: 33,
    maxCapacity: 10,
    name: "Kho Kho"
  },
  "Badminton": {
    price: 18,
    maxCapacity: 18,
    name: "Badminton"
  },
  "Football": {
    price: 33,
    maxCapacity: 16,
    name: "Football"
  },
  "Netball": {
    price: 33,
    maxCapacity: 8,
    name: "Netball"
  },
  "Kabaddi (men's)": {
    price: 33,
    maxCapacity: 4,
    name: "Kabaddi (men's)"
  },
  "Kabaddi (women's)": {
    price: 33,
    maxCapacity: 4,
    name: "Kabaddi (women's)"
  }
}

// ======================
// UNIVERSITIES DATA
// ======================
export const universities = [
  // ===== NORTH & CENTRAL ZONE (NZ+CZ) - Nov 22, 2025 =====
  // Competing universities with sports information
  { id: "45", name: "Loughborough", zone: "NZ+CZ", sports: ["Netball", "Football", "Badminton", "Kho Kho"],
    teamInfo: { "Netball": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Kho Kho": { teamA: { isOpen: true }, teamB: { isOpen: true } } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Loughborough Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "50", name: "Warwick", zone: "NZ+CZ", sports: ["Netball", "Football", "Badminton", "Kho Kho", "Kabaddi (men's)"],
    teamInfo: { "Netball": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kho Kho": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Warwick Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "37", name: "Sheffield", zone: "NZ+CZ", sports: ["Netball", "Football", "Badminton", "Kho Kho"],
    teamInfo: { "Netball": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Kho Kho": { teamA: { isOpen: true }, teamB: { isOpen: true } } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Sheffield Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "39", name: "York", zone: "NZ+CZ", sports: ["Football", "Badminton", "Kho Kho", "Kabaddi (men's)", "Kabaddi (women's)"],
    teamInfo: { "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: null }, "Kabaddi (women's)": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "York Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "3", name: "Manchester", zone: "NZ+CZ", sports: ["Netball", "Football", "Badminton", "Kho Kho", "Kabaddi (men's)", "Kabaddi (women's)"],
    teamInfo: { "Netball": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kho Kho": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kabaddi (women's)": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Manchester Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "44", name: "Leicester", zone: "NZ+CZ", sports: ["Netball", "Football", "Badminton", "Kho Kho"],
    teamInfo: { "Netball": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Kho Kho": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Leicester Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "48", name: "Birmingham", zone: "NZ+CZ", sports: ["Netball", "Football", "Badminton", "Kho Kho", "Kabaddi (men's)"],
    teamInfo: { "Netball": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "University of Birmingham Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "4", name: "Nottingham", zone: "NZ+CZ", sports: ["Netball", "Football", "Badminton", "Kho Kho"],
    teamInfo: { "Netball": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Kho Kho": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Nottingham Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "47", name: "Nottingham Trent", zone: "NZ+CZ", sports: ["Football", "Badminton"],
    teamInfo: { "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: true } } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Nottingham Trent Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "42", name: "Coventry", zone: "NZ+CZ", sports: ["Football"],
    teamInfo: { "Football": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Coventry Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "35", name: "Keele", zone: "NZ+CZ", sports: ["Badminton", "Kho Kho"],
    teamInfo: { "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kho Kho": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Keele Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "2", name: "Leeds", zone: "NZ+CZ", sports: ["Netball", "Football", "Badminton", "Kho Kho"],
    teamInfo: { "Netball": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Kho Kho": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Leeds University Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "41", name: "Cambridge", zone: "NZ+CZ", sports: ["Football", "Badminton", "Kho Kho", "Kabaddi (men's)", "Kabaddi (women's)"],
    teamInfo: { "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kabaddi (women's)": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, description: "Cambridge Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  { id: "43", name: "DMU", zone: "NZ+CZ", sports: ["Football", "Badminton"],
    teamInfo: { "Football": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: true } } },
    members: 0, wins: 0, losses: 0, points: 0, description: "DMU Hindu Society", tournamentDate: "Nov 22, 2025", isCompeting: true },
  // Special case: KCL Woman's Kabaddi - KCL is competing in BOTH zones
  // LZ+SZ: Badminton, Football, Kabaddi (men's)
  // NZ+CZ: Kabaddi (women's) only - due to insufficient teams in LZ+SZ
  { id: "18-kabaddi-womens", name: "KCL", zone: "NZ+CZ", sports: ["Kabaddi (women's)"],
    teamInfo: { "Kabaddi (women's)": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Riya Sareen", contactRole: "Head of Sports", contactEmail: "riyasareen06@gmail.com", contactPhone: "07790092007",
    approximateTotal: 33, // Approx £33 (Kabaddi women's A £33)
    members: 0, wins: 0, losses: 0, points: 0, 
    description: "KCL Hindu Society - Women's Kabaddi team competing in North & Central Zone. Note: KCL is competing in BOTH zones - in London & South Zone (LZ+SZ) for Badminton, Football, and Men's Kabaddi, and in North & Central Zone (NZ+CZ) for Women's Kabaddi only due to insufficient teams in LZ+SZ.",
    tournamentDate: "Nov 22, 2025", isCompeting: true, isSpecialCase: true, originalZone: "LZ+SZ" },
  // Schools competing in NZ+CZ
  { id: "trafford-school", name: "Trafford", zone: "NZ+CZ", sports: ["Badminton", "Football", "Kho Kho", "Netball"],
    teamInfo: { "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Football": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Kho Kho": { teamA: { isOpen: true }, teamB: { isOpen: true } }, "Netball": { teamA: { isOpen: true }, teamB: null } },
    members: 0, wins: 0, losses: 0, points: 0, 
    description: "Trafford School - Competing in North & Central Zone",
    tournamentDate: "Nov 22, 2025", isCompeting: true, isSchool: true },

  // ===== LONDON & SOUTH ZONE (LZ+SZ) - Nov 23, 2025 =====
  // Competing universities only - Sports from tournament table
  // Sports array: shows each sport once (even if Team A & B exist)
  // teamInfo: tracks Team A/B status for each sport (Team B locked until Team A opens)
  { id: "18", name: "KCL", zone: "LZ+SZ", sports: ["Badminton", "Football", "Kabaddi (men's)"], 
    teamInfo: { "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Riya Sareen", contactRole: "Head of Sports", contactEmail: "riyasareen06@gmail.com", contactPhone: "07790092007",
    approximateTotal: 51, // Approx £51
    members: 0, wins: 0, losses: 0, points: 0, description: "KCL Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "57", name: "Essex", zone: "LZ+SZ", sports: ["Badminton", "Football"],
    teamInfo: { "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Priya Patel", contactRole: "President", contactEmail: "Aakashsainixko@gmail.com", contactPhone: "07588 150649",
    approximateTotal: 51, // Approx £51
    members: 0, wins: 0, losses: 0, points: 0, description: "Essex Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "31", name: "UCL", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton", "Football", "Netball"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Netball": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Hanisha Patel", contactRole: "Sports Coordinator", contactEmail: "hanishapatel12@gmail.com", contactPhone: "07909369366",
    approximateTotal: 84, // Approx £84
    members: 0, wins: 0, losses: 0, points: 0, description: "UCL Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "53", name: "Brunel", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton", "Football", "Netball"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: false } }, "Football": { teamA: { isOpen: true }, teamB: { isOpen: false } }, "Netball": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Boshupriyo Bijan Mandal", contactRole: "Sport coordinator", contactEmail: "20boshu05@gmail.com", contactPhone: "07488275942",
    approximateTotal: 84, // Approx £84
    members: 0, wins: 0, losses: 0, points: 0, description: "Brunel Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "20", name: "LSE", zone: "LZ+SZ", sports: ["Badminton", "Football", "Netball", "Kabaddi (men's)"],
    teamInfo: { "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Netball": { teamA: { isOpen: true }, teamB: null }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Nikita Biju", contactRole: "Sport", contactEmail: "nikitabiju2006@gmail.com", contactPhone: "07914152044",
    approximateTotal: 84, // Approx £84
    members: 0, wins: 0, losses: 0, points: 0, description: "LSE Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "24", name: "QMUL", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Thira Vekaria", contactRole: "Sports coordinator", contactEmail: "thira_v@hotmail.com", contactPhone: "07368131098",
    approximateTotal: 51, // Approx £51
    members: 0, wins: 0, losses: 0, points: 0, description: "QMUL Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "55", name: "City", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton", "Football", "Netball"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Netball": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Dhanisha Patel", contactRole: "President", contactEmail: "dhanisha.p155@gmail.com", contactPhone: "07401982997",
    approximateTotal: 51, // Approx £51
    members: 0, wins: 0, losses: 0, points: 0, description: "City Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "17", name: "Imperial", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton", "Football", "Kabaddi (men's)"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: false } }, "Football": { teamA: { isOpen: true }, teamB: { isOpen: false } }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Karthik Venkatesh", contactRole: "President", contactEmail: "karthik.venkatesh23@imperial.ac.uk", contactPhone: "07446108841",
    contacts: [
      { contactPerson: "Karthik Venkatesh", contactRole: "President", contactEmail: "karthik.venkatesh23@imperial.ac.uk", contactPhone: "07446108841" },
      { contactPerson: "Shiv Patel", contactRole: "Football sports coordinator", contactEmail: "Sp1824@ic.ac.uk", contactPhone: "07421727340" }
    ],
    approximateTotal: 117, // Approx £117
    members: 0, wins: 0, losses: 0, points: 0, description: "Imperial Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "26", name: "Royal Holloway", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton", "Football", "Netball", "Kabaddi (men's)"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null }, "Netball": { teamA: { isOpen: true }, teamB: null }, "Kabaddi (men's)": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Varun Shivakumar", contactRole: "Events Coordinator", contactEmail: "varun6223@gmail.com", contactPhone: "07769413128",
    approximateTotal: 117, // Approx £117
    members: 0, wins: 0, losses: 0, points: 0, description: "Royal Holloway Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "54", name: "Cardiff", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton", "Football", "Netball"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: false } }, "Football": { teamA: { isOpen: true }, teamB: null }, "Netball": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Aryan Jain", contactRole: "President", contactEmail: "Nhsfcardiff@gmail.com", contactPhone: "07419741154",
    contacts: [
      { contactPerson: "Aryan Jain", contactRole: "President", contactEmail: "Nhsfcardiff@gmail.com", contactPhone: "07419741154" },
      { contactPerson: "Aryan Jain", contactRole: "2nd POC", contactEmail: "Aryanjainuk@gmail.com", contactPhone: "+44 7488 320075" }
    ],
    approximateTotal: 135, // Approx £135 (Badminton A £18 + Badminton B £18 + Kho Kho A £33 + Netball A £33 + Football A £33)
    members: 0, wins: 0, losses: 0, points: 0, description: "Cardiff Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "52", name: "Bristol", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton", "Football"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: { isOpen: false } }, "Badminton": { teamA: { isOpen: true }, teamB: { isOpen: false } }, "Football": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Rishi Amin", contactRole: "Co-President", contactEmail: "Nhsfbristol@gmail.com", contactPhone: "07435665560",
    contacts: [
      { contactPerson: "Rishi Amin", contactRole: "Co-President", contactEmail: "Nhsfbristol@gmail.com", contactPhone: "07435665560" },
      { contactPerson: "2nd POC", contactRole: "2nd POC", contactEmail: "qs22114@bristol.ac.uk", contactPhone: "+44 7510 329586" }
    ],
    approximateTotal: 135, // Approx £135 (Badminton A £18 + Badminton B £18 + Kho Kho A £33 + Kho Kho B £33 + Football A £33)
    members: 0, wins: 0, losses: 0, points: 0, description: "Bristol Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "60", name: "Brighton & Sussex", zone: "LZ+SZ", sports: ["Badminton", "Football"],
    teamInfo: { "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Mansi Shah", contactRole: "President", contactEmail: "mansiben.shah2005@gmail.com", contactPhone: "07488551933",
    contacts: [
      { contactPerson: "Mansi Shah", contactRole: "President", contactEmail: "mansiben.shah2005@gmail.com", contactPhone: "07488551933" },
      { contactPerson: "2nd POC", contactRole: "2nd POC", contactEmail: "yj250@sussex.ac.uk", contactPhone: "+91 99994 06000" }
    ],
    approximateTotal: 51, // Approx £51 (Badminton A £18 + Football A £33)
    members: 0, wins: 0, losses: 0, points: 0, description: "Brighton & Sussex Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "61", name: "Reading", zone: "LZ+SZ", sports: ["Kho Kho", "Badminton", "Football"],
    teamInfo: { "Kho Kho": { teamA: { isOpen: true }, teamB: null }, "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Meera Malaiya", contactRole: "President", contactEmail: "meeramalaiya@gmail.com", contactPhone: "07436377072",
    contacts: [
      { contactPerson: "Meera Malaiya", contactRole: "President", contactEmail: "meeramalaiya@gmail.com", contactPhone: "07436377072" },
      { contactPerson: "2nd POC", contactRole: "2nd POC", contactEmail: "aravindnachiappan@gmail.com", contactPhone: "07442426846" }
    ],
    approximateTotal: 84, // Approx £84 (Badminton A £18 + Kho Kho A £33 + Football A £33)
    members: 0, wins: 0, losses: 0, points: 0, description: "Reading Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "62", name: "Bath", zone: "LZ+SZ", sports: ["Badminton", "Football"],
    teamInfo: { "Badminton": { teamA: { isOpen: true }, teamB: null }, "Football": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Tanay", contactRole: "Sports", contactEmail: "Tjr72@bath.ac.uk", contactPhone: "07876660950",
    contacts: [
      { contactPerson: "Tanay", contactRole: "Sports", contactEmail: "Tjr72@bath.ac.uk", contactPhone: "07876660950" },
      { contactPerson: "2nd POC", contactRole: "2nd POC", contactEmail: "krutagnasuresh@gmail.com", contactPhone: "07721057836" }
    ],
    approximateTotal: 51, // Approx £51 (Badminton A £18 + Football A £33)
    members: 0, wins: 0, losses: 0, points: 0, description: "Bath Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
  { id: "63", name: "Southampton", zone: "LZ+SZ", sports: ["Football"],
    teamInfo: { "Football": { teamA: { isOpen: true }, teamB: null } },
    contactPerson: "Abhimanyu Tyagi", contactRole: "Football Rep", contactEmail: "at16g24@soton.ac.uk", contactPhone: "0795729652",
    contacts: [
      { contactPerson: "Abhimanyu Tyagi", contactRole: "Football Rep", contactEmail: "at16g24@soton.ac.uk", contactPhone: "0795729652" },
      { contactPerson: "2nd POC", contactRole: "2nd POC", contactEmail: "", contactPhone: "07421520335" }
    ],
    approximateTotal: 33, // Approx £33 (Football A £33)
    members: 0, wins: 0, losses: 0, points: 0, description: "Southampton Hindu Society", tournamentDate: "Nov 23, 2025", isCompeting: true },
]

// Component that uses useSearchParams - must be wrapped in Suspense
function TeamsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTournament, setSelectedTournament] = useState<"all" | "NZ+CZ" | "LZ+SZ">("all")
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null)
  const [universityPlayers, setUniversityPlayers] = useState<{[sport: string]: any[]}>({})
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  
  // Registration form state
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formUniversityName, setFormUniversityName] = useState("")
  const [formRegion, setFormRegion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Dynamic universities data from Firebase
  const [universitiesData, setUniversitiesData] = useState<any[]>([])
  const [loadingUniversities, setLoadingUniversities] = useState(true)

  // Read zone query parameter from URL and set filter
  useEffect(() => {
    const zone = searchParams.get('zone')
    if (zone === 'LZ+SZ' || zone === 'NZ+CZ') {
      setSelectedTournament(zone)
    } else {
      setSelectedTournament('all')
    }
  }, [searchParams])

  // Dynamic venue information
  const venueInfo = {
    'NZ+CZ': {
      name: 'Avanti Field School',
      address: '21 Bhaktivedanta Marg, Leicester, LE5 0BX, England',
      availability: [
        { facility: 'Large Sports Hall', time: '8:30am-4:45pm' },
        { facility: 'Main Hall', time: '9:00am-2:45pm' },
        { facility: 'Sports Hall', time: '11:30am-2:30pm' }
      ],
      slots: {
        morning: [
          'Netball courts (Large Sports Hall)',
          'Badminton courts (Large Sports Hall)', 
          'Kabaddi Female (Main Hall)'
        ],
        afternoon: [
          'Kabaddi Male (Main Hall)',
          'Sports hall',
          'Kho Kho pitches (Large Sports Hall)'
        ]
      }
    },
    'LZ+SZ': {
      name: 'Queen Park Community School',
      address: 'Aylestone Ave, London NW6 7BQ, England',
      availability: [
        { facility: 'Gym', time: '9:00am-2pm' },
        { facility: 'Sports Hall', time: '8:00am-6pm' },
        { facility: 'Hall', time: '1pm-3pm' },
        { facility: 'Sports Hall', time: '12pm-3pm' }
      ],
      slots: {
        morning: [
          '1 Kho Kho pitch (Gym)',
          '3 Badminton courts (Sports Hall)',
          '1 Kho Kho pitch (Sports Hall)'
        ],
        afternoon: [
          '1 Netball court (Sports Hall)',
          '1 Kabaddi court (Hall)',
          '2 Kho Kho pitches (Sports Hall)'
        ]
      }
    }
  }

  // Real-time Firestore listener for universities
  useEffect(() => {
    const universitiesRef = collection(db, "universities")
    const q = query(universitiesRef, orderBy("name"))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const registeredUniversities = snapshot.docs.map(doc => {
        const firebaseData = doc.data()
        const universityName = firebaseData.name || ""
        
        // Find matching static university data to merge sports and teamInfo
        const staticUni = universities.find(u => u.name === universityName)
        
        return {
        id: doc.id,
          ...firebaseData,
          zone: firebaseData.zone || "Unknown",
          // Use sports from Firebase if available, otherwise use static data
          sports: firebaseData.sports && firebaseData.sports.length > 0 && firebaseData.sports[0] !== "TBD" 
            ? firebaseData.sports 
            : (staticUni?.sports || []),
          // Merge teamInfo from static data if available
          teamInfo: staticUni?.teamInfo || firebaseData.teamInfo || {},
          // Include contact details (publicly visible: name and role only)
          contactPerson: firebaseData.contactPerson || '',
          contactRole: firebaseData.contactRole || '',
          members: firebaseData.members || 0,
          wins: firebaseData.wins || 0,
          losses: firebaseData.losses || 0,
          points: firebaseData.points || 0,
          description: firebaseData.description || staticUni?.description || `${universityName} Hindu Society`,
          tournamentDate: firebaseData.date === "2025-11-22" ? "Nov 22, 2025" : (staticUni?.tournamentDate || "Nov 23, 2025"),
          isCompeting: firebaseData.status === "competing" || firebaseData.isCompeting === true || staticUni?.isCompeting === true,
          isSchool: (staticUni as any)?.isSchool || (firebaseData as any)?.isSchool || false,
        isRegistered: true
        }
      })
      
      // Separate universities into competing and not competing, then sort each group alphabetically
      const competingUniversities = registeredUniversities
        .filter(uni => uni.status === "competing" || uni.isCompeting === true)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      const notCompetingUniversities = registeredUniversities
        .filter(uni => uni.status !== "competing" && uni.isCompeting !== true)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      const sortedUniversities = [...competingUniversities, ...notCompetingUniversities]
      
      setUniversitiesData(sortedUniversities)
      setLoadingUniversities(false)
    }, (error) => {
      console.error("Error fetching universities:", error)
      setLoadingUniversities(false)
    })
    
    return () => unsubscribe()
  }, [])

  // ✅ Merge static universities with Firebase data
  // Get static competing universities that match the selected tournament
  const staticCompetingUnis = universities.filter(uni => {
    if (!uni.isCompeting) return false
    if (selectedTournament === "all") return true
    return uni.zone === selectedTournament
  })
  
  console.log('📊 Static competing universities:', staticCompetingUnis.length, staticCompetingUnis.map(u => ({ name: u.name, zone: u.zone, isSchool: (u as any).isSchool })))
  
  // Create a map of existing universities by name for deduplication
  const existingUniNames = new Set(universitiesData.map(uni => uni.name.toLowerCase()))
  
  // Add static universities that aren't already in universitiesData
  const staticUnisToAdd = staticCompetingUnis
    .filter(staticUni => !existingUniNames.has(staticUni.name.toLowerCase()))
    .map(staticUni => ({
      id: staticUni.id || `static-${staticUni.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: staticUni.name,
      zone: staticUni.zone,
      sports: staticUni.sports || [],
      teamInfo: staticUni.teamInfo || {},
      members: staticUni.members || 0,
      wins: staticUni.wins || 0,
      losses: staticUni.losses || 0,
      points: staticUni.points || 0,
      description: staticUni.description || `${staticUni.name} Hindu Society`,
      tournamentDate: staticUni.tournamentDate,
      isCompeting: true,
      status: 'competing',
      isSchool: (staticUni as any).isSchool || false,
      isRegistered: false
    }))
  
  // Combine Firebase data with static universities
  const allUniversities = [...universitiesData, ...staticUnisToAdd]
  
  console.log('📊 All universities (Firebase + Static):', allUniversities.length)
  console.log('📊 Static universities to add:', staticUnisToAdd.length, staticUnisToAdd.map(u => ({ name: u.name, zone: u.zone, isSchool: u.isSchool })))
  
  // ✅ Automatically sort alphabetically by name
  const filteredUniversities = (
    selectedTournament === "all"
      ? allUniversities
      : allUniversities.filter((uni) => uni.zone === selectedTournament)
  ).sort((a, b) => a.name.localeCompare(b.name))
  
  console.log('📊 Filtered universities:', filteredUniversities.length, 'Selected tournament:', selectedTournament)
  console.log('📊 Filtered universities with schools:', filteredUniversities.filter(u => (u as any).isSchool).map(u => u.name))

  // Count universities that are actually competing (based on isCompeting field or status)
  const competingUniversitiesList = filteredUniversities.filter(uni => 
    (uni.isCompeting === true || uni.status === "competing") && !(uni as any).isSchool
  )
  
  // Separate schools from universities
  const competingSchoolsList = filteredUniversities.filter(uni => {
    const isSchool = (uni as any).isSchool === true
    const isCompeting = (uni.isCompeting === true || uni.status === "competing")
    if (isSchool && isCompeting) {
      console.log('🏫 Found school:', uni.name, 'Zone:', uni.zone, 'isSchool:', isSchool)
    }
    return isCompeting && isSchool
  })
  
  console.log('📊 Competing Schools List:', competingSchoolsList.length, competingSchoolsList.map(s => s.name))
  
  const totalCompetingUniversities = competingUniversitiesList.length
  const totalRegisteredUniversities = filteredUniversities.length

  const totalPlayers = filteredUniversities.reduce((sum, uni) => sum + (uni.members || 0), 0)
  const totalWins = filteredUniversities.reduce((sum, uni) => sum + (uni.wins || 0), 0)
  const totalGames = filteredUniversities.reduce((sum, uni) => sum + (uni.wins || 0) + (uni.losses || 0), 0)
  const totalPoints = filteredUniversities.reduce((sum, uni) => sum + (uni.points || 0), 0)

  const handleViewDetails = (university: any) => setSelectedUniversity(university)

  // Fetch players for selected university
  useEffect(() => {
    if (!selectedUniversity || !selectedUniversity.id) {
      setUniversityPlayers({})
      return
    }

    async function fetchPlayers() {
      setLoadingPlayers(true)
      try {
        const uniId = selectedUniversity.id
        const sports = selectedUniversity.sports || []
        const playersBySport: {[sport: string]: any[]} = {}

        // Fetch players for each sport
        for (const sport of sports) {
          if (!sport || sport === 'TBD') continue
          
          const sportId = sport.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          const playersRef = ref(realtimeDb, `universities/${uniId}/sports/${sportId}/teams`)
          
          try {
            const snapshot = await get(playersRef)
            
            if (snapshot.exists()) {
              const teamsData = snapshot.val()
              const allPlayers: any[] = []
              
              // Iterate through all teams (main_team, team_a, team_b, etc.)
              Object.keys(teamsData).forEach(teamId => {
                const teamPlayers = teamsData[teamId]?.players || {}
                Object.keys(teamPlayers).forEach(playerId => {
                  const player = teamPlayers[playerId]
                  if (player) {
                    allPlayers.push({
                      id: playerId,
                      name: `${player.firstName || ''} ${player.lastName || ''}`.trim() || player.name || 'Unknown',
                      sport: sport,
                      team: teamId === 'main_team' ? 'Main Team' : teamId === 'team_a' ? 'Team A' : teamId === 'team_b' ? 'Team B' : teamId,
                      ...player
                    })
                  }
                })
              })
              
              if (allPlayers.length > 0) {
                playersBySport[sport] = allPlayers
              }
            }
          } catch (error) {
            console.error(`Error fetching players for ${sport}:`, error)
          }
        }
        
        setUniversityPlayers(playersBySport)
      } catch (error) {
        console.error('Error fetching players:', error)
        setUniversityPlayers({})
      } finally {
        setLoadingPlayers(false)
      }
    }

    fetchPlayers()
  }, [selectedUniversity])

  // University registration function
  async function handleUniversitySignup(event: React.FormEvent) {
    event.preventDefault()

    const email = formEmail
    const password = formPassword
    const name = formUniversityName
    const region = formRegion

    try {
      setIsLoading(true)
      
      // 1. Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCred.user.uid
      
      // 2. Find matching static university data to pre-populate sports (for LZ+SZ)
      const staticUni = universities.find(u => u.name === name && u.zone === region)
      
      // 3. Save university data in Realtime Database with pre-populated sports for LZ+SZ
      await set(ref(realtimeDb, "universities/" + uid), {
        id: uid,
        name,
        region,
        zone: region, // Add zone field for login page compatibility
        email,
        createdBy: uid,
        status: "competing",
        isCompeting: true, // Automatically set as competing when they sign up
        // Pre-populate sports and teamInfo for LZ+SZ universities from static data
        sports: staticUni?.sports || [],
        teamInfo: staticUni?.teamInfo || {},
        members: 0,
        wins: 0,
        losses: 0,
        points: 0,
        description: staticUni?.description || `${name} Hindu Society`,
        tournamentDate: region === "NZ+CZ" ? "Nov 22, 2025" : "Nov 23, 2025",
        createdAt: Date.now(),
        lastUpdated: Date.now()
      })
      
      alert("University registered successfully! You can now log in.")
      
      // Reset form
      setFormEmail("")
      setFormPassword("")
      setFormUniversityName("")
      setFormRegion("")
      setShowRegistrationForm(false)
    } catch (error: any) {
      
      // 🎯 Friendly Firebase error handling
      if (error.code === "auth/email-already-in-use") {
        alert("⚠️ This university email has already been registered. Please log in instead.")
      } else if (error.code === "auth/invalid-email") {
        alert("❌ Please enter a valid email address.")
      } else if (error.code === "auth/weak-password") {
        alert("🔒 Your password is too weak. Please use at least 6 characters.")
      } else if (error.code === "auth/network-request-failed") {
        alert("🌐 Network error. Please check your internet connection and try again.")
      } else {
        alert("❌ Something went wrong during registration. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="py-8 sm:py-12 px-4">
        <div className="container mx-auto">
          {/* University Registration Form */}
          {showRegistrationForm && (
            <Card className="max-w-2xl mx-auto mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-center text-blue-900 flex items-center justify-center">
                  <Plus className="w-6 h-6 mr-2" />
                  Register New University
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUniversitySignup} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="universityName">University Name</Label>
                      <Input
                        id="universityName"
                        type="text"
                        value={formUniversityName}
                        onChange={(e) => setFormUniversityName(e.target.value)}
                        placeholder="Enter university name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Select value={formRegion} onValueChange={setFormRegion} required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NZ+CZ">North & Central Zone</SelectItem>
                          <SelectItem value="LZ+SZ">London & South Zone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="Enter university email"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Register University"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRegistrationForm(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add University Button */}
          {!showRegistrationForm && (
            <div className="text-center mb-8">
              <Button
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Register New University
              </Button>
              
              {/* Admin: Initialize Universities Button */}
              {universitiesData.length === 0 && (
                <div className="mt-4">
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/initialize-universities');
                        const result = await response.json();
                        if (result.success) {
                          alert(`✅ All ${result.count} NHSF universities have been added!`);
                        } else {
                          alert('❌ Error: ' + result.error);
                        }
                      } catch (error) {
                        alert('❌ Network error: ' + error);
                      }
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Initialize All NHSF Universities
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Zonal Tournaments
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Join us for the NHSF (UK) Dharmic Games Zonal Tournaments featuring the <strong>North & Central Zone</strong> (November 22, 2025) and <strong>London & South Zone</strong> (November 23, 2025). Universities are currently registering for their preferred sports.
            </p>
          </div>

          {/* Venue Information for NZ+CZ */}
          {selectedTournament === 'NZ+CZ' && (
            <Card className="mb-8 bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  North & Central Zone - Venue Information
                </CardTitle>
                <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-800 text-sm font-medium">
                    <strong>📍 Venue:</strong> {venueInfo['NZ+CZ'].name}<br/>
                    <strong>📍 Address:</strong> {venueInfo['NZ+CZ'].address}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-red-800 mb-3">Tournament Status</h4>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Venue:</strong> {venueInfo['NZ+CZ'].name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Timing:</strong> Confirmed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span><strong>Competing Universities:</strong> {totalCompetingUniversities} of 23 confirmed</span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-red-800 mb-3">Venue Availability</h4>
                    <div className="space-y-2 text-sm">
                      {venueInfo['NZ+CZ'].availability.map((facility, index) => (
                        <div key={index} className="flex justify-between">
                          <span><strong>{facility.facility}:</strong></span>
                          <span className="text-orange-600">{facility.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-3">Available Slots</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-red-700">Morning (AM):</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          {venueInfo['NZ+CZ'].slots.morning.map((slot, index) => (
                            <li key={index}>• {slot}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-red-700">Afternoon (PM):</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          {venueInfo['NZ+CZ'].slots.afternoon.map((slot, index) => (
                            <li key={index}>• {slot}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Sport selections are currently "TBD" (To Be Determined) as registration forms are pending submission to university chapters.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Venue Information for LZ+SZ */}
          {selectedTournament === 'LZ+SZ' && (
            <Card className="mb-8 bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  London & South Zone - Venue Information
                </CardTitle>
                <div className="mt-2 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium">
                    <strong>📍 Venue:</strong> {venueInfo['LZ+SZ'].name}<br/>
                    <strong>📍 Address:</strong> {venueInfo['LZ+SZ'].address}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-3">Tournament Status</h4>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>University List:</strong> Confirmed ({totalRegisteredUniversities} universities)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Venue:</strong> {venueInfo['LZ+SZ'].name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Timing:</strong> Confirmed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span><strong>Sport Selections:</strong> Pending form submission</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span><strong>Competing Universities:</strong> {totalCompetingUniversities} of {totalRegisteredUniversities} confirmed</span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-blue-800 mb-3">Venue Availability</h4>
                    <div className="space-y-2 text-sm">
                      {venueInfo['LZ+SZ'].availability.map((facility, index) => (
                        <div key={index} className="flex justify-between">
                          <span><strong>{facility.facility}:</strong></span>
                          <span className="text-orange-600">{facility.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-3">Available Slots</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Morning (AM):</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          {venueInfo['LZ+SZ'].slots.morning.map((slot, index) => (
                            <li key={index}>• {slot}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Afternoon (PM):</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          {venueInfo['LZ+SZ'].slots.afternoon.map((slot, index) => (
                            <li key={index}>• {slot}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Sport selections are currently "TBD" (To Be Determined) as registration forms are pending submission to university chapters.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tournament Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              variant={selectedTournament === "all" ? "default" : "outline"}
              onClick={() => setSelectedTournament("all")}
              className={`flex items-center space-x-2 ${
                selectedTournament === "all"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  : ""
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>All Tournaments ({universitiesData.length})</span>
            </Button>

            <Button
              variant={selectedTournament === "NZ+CZ" ? "default" : "outline"}
              onClick={() => setSelectedTournament("NZ+CZ")}
              className={`flex items-center space-x-2 ${
                selectedTournament === "NZ+CZ"
                  ? "bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white"
                  : "border-red-300 text-red-600 hover:bg-red-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>North & Central (Nov 22) ({universitiesData.filter(uni => uni.zone === "NZ+CZ").length})</span>
            </Button>

            <Button
              variant={selectedTournament === "LZ+SZ" ? "default" : "outline"}
              onClick={() => setSelectedTournament("LZ+SZ")}
              className={`flex items-center space-x-2 ${
                selectedTournament === "LZ+SZ"
                  ? "bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white"
                  : "border-blue-300 text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>London & South (Nov 23) ({universitiesData.filter(uni => uni.zone === "LZ+SZ").length})</span>
            </Button>
          </div>

          {/* Filter Status */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredUniversities.length} universities
              {selectedTournament !== "all" && ` in ${selectedTournament === "NZ+CZ" ? "North & Central Zone" : "London & South Zone"}`}
            </p>
            
          </div>

          {/* Sports Capacity - Only show for LZ+SZ */}
          {selectedTournament === "LZ+SZ" || selectedTournament === "all" ? (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Sports Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(sportsConfig).map(([sportName, config]) => {
                    // Count confirmed teams for this sport
                    const confirmedTeams = competingUniversitiesList.reduce((count, uni) => {
                      if (!uni.sports || !uni.sports.includes(sportName)) return count;
                      const teamInfo = uni.teamInfo?.[sportName];
                      let teamCount = 0;
                      if (teamInfo?.teamA?.isOpen !== false) teamCount++;
                      if (teamInfo?.teamB?.isOpen === true) teamCount++;
                      return count + teamCount;
                    }, 0);
                    
                    const isFull = confirmedTeams >= config.maxCapacity;
                    
                    return (
                      <div key={sportName} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{sportName}</h3>
                          <Badge variant={isFull ? "destructive" : "default"}>
                            {isFull ? "Full" : `${confirmedTeams}/${config.maxCapacity}`}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Capacity:</span>
                            <span className="text-gray-700">{config.maxCapacity} teams</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Confirmed:</span>
                            <span className="text-gray-700">{confirmedTeams} teams</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Universities Grid */}
          {loadingUniversities ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading teams...</p>
            </div>
          ) : (
            <div className="space-y-12 mb-8 sm:mb-12">
              {/* Competing Universities Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Trophy className="w-6 h-6 text-green-600 mr-2" />
                    Competing Universities ({competingUniversitiesList.length})
                  </h2>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Active
                  </Badge>
                </div>
                {competingUniversitiesList.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {competingUniversitiesList
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((university) => (
                        <UniversityCard
                          key={university.id}
                          university={university}
                          onViewDetails={handleViewDetails}
                          showAdminControls={false}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No universities are currently competing</p>
                    <p className="text-sm text-gray-500 mt-2">Universities will appear here once they register for sports</p>
                  </div>
                )}
              </div>

              {/* Competing Schools Section - Show for NZ+CZ or when viewing all zones */}
              {(selectedTournament === "NZ+CZ" || selectedTournament === "all") && competingSchoolsList.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <Trophy className="w-6 h-6 text-purple-600 mr-2" />
                      Competing Schools ({competingSchoolsList.length})
                    </h2>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                      Schools
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {competingSchoolsList
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((school) => (
                        <UniversityCard
                          key={school.id}
                          university={school}
                          onViewDetails={handleViewDetails}
                          showAdminControls={false}
                        />
                      ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8">
            <Card className="text-center">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{totalPlayers}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-gray-600">Total Players</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{totalWins}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-gray-600">Total Wins</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{totalGames}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-gray-600">Games Played</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{totalPoints.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-gray-600">Total Points</p>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Filter className="w-4 h-4" />
                  <span>
                    All universities are automatically sorted alphabetically and grouped by their tournament zones.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* University Details Dialog */}
      <Dialog open={!!selectedUniversity} onOpenChange={(open) => !open && setSelectedUniversity(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-orange-600" />
              <span>{selectedUniversity?.name || 'University Details'}</span>
            </DialogTitle>
            <DialogDescription>
              View players and contact information for this university
            </DialogDescription>
          </DialogHeader>

          {selectedUniversity && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Main Contact
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {selectedUniversity.contacts && selectedUniversity.contacts.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUniversity.contacts
                        .filter((contact: any) => contact.contactRole?.toLowerCase().includes('main') || !contact.contactRole?.toLowerCase().includes('2nd'))
                        .map((contact: any, index: number) => (
                          <div key={index}>
                            <div className="font-medium text-blue-900">{contact.contactPerson || 'N/A'}</div>
                            {contact.contactRole && (
                              <div className="text-sm text-blue-700">{contact.contactRole}</div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : selectedUniversity.contactPerson ? (
                    <div>
                      <div className="font-medium text-blue-900">{selectedUniversity.contactPerson}</div>
                      {selectedUniversity.contactRole && (
                        <div className="text-sm text-blue-700">{selectedUniversity.contactRole}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">No contact information available</div>
                  )}
                </div>
              </div>

              {/* Players by Sport */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Gamepad2 className="w-5 h-5 mr-2 text-green-600" />
                  Players
                </h3>
                
                {loadingPlayers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600 mr-2" />
                    <span className="text-gray-600">Loading players...</span>
                  </div>
                ) : Object.keys(universityPlayers).length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                    No players registered yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedUniversity.sports
                      ?.filter((sport: string) => sport && sport !== 'TBD')
                      .map((sport: string) => {
                        const players = universityPlayers[sport] || []
                        return (
                          <div key={sport} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Badge variant="outline" className="mr-2">{sport}</Badge>
                              <span className="text-sm text-gray-600">
                                ({players.length} {players.length === 1 ? 'player' : 'players'})
                              </span>
                            </h4>
                            {players.length === 0 ? (
                              <div className="text-sm text-gray-500 italic">No players registered for this sport</div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {players.map((player: any) => (
                                  <div key={player.id} className="bg-gray-50 rounded p-2 text-sm">
                                    <div className="font-medium text-gray-900">{player.name}</div>
                                    <div className="text-xs text-gray-600">{player.team}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}

// Default export with Suspense boundary
export default function TeamsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading teams page...</p>
        </div>
      </div>
    }>
      <TeamsPageContent />
    </Suspense>
  )
}