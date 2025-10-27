import { Suspense } from "react"
import { HeroSection } from "@/components/hero-section"
import { UnifiedLeagueTable } from "@/components/unified-league-table"
import { LiveStatsCards } from "@/components/live-stats-cards"
import { FlexibleLiveResults } from "@/components/flexible-live-results"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <HeroSection />
      <main>
        <div className="container mx-auto px-4 py-8">
          <FlexibleLiveResults zone="all" showControls={false} />
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 rounded-lg mx-4" />}>
          <UnifiedLeagueTable />
        </Suspense>
        <LiveStatsCards />
      </main>
      <Footer />
    </div>
  )
}
