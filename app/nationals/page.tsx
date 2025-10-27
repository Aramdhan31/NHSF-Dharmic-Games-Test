"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Calendar, MapPin, Users, Clock, Zap, Target, Award, Crown, Star } from "lucide-react"

export default function NationalsPage() {
	const [timeLeft, setTimeLeft] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0
	})

	// Calculate approximate time until February 2026 (using February 1st as reference)
	const currentDate = new Date()
	const currentYear = currentDate.getFullYear()
	const currentMonth = currentDate.getMonth()
	
	// If we're already in 2026 and past February, target February 2027
	// Otherwise target February 2026
	const targetYear = (currentYear === 2026 && currentMonth >= 1) ? 2027 : 2026
	const targetDate = new Date(targetYear, 1, 1) // February 1st

	useEffect(() => {
		const timer = setInterval(() => {
			const now = new Date().getTime()
			const distance = targetDate.getTime() - now

			if (distance > 0) {
				setTimeLeft({
					days: Math.floor(distance / (1000 * 60 * 60 * 24)),
					hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
					minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
					seconds: Math.floor((distance % (1000 * 60)) / 1000)
				})
			}
		}, 1000)

		return () => clearInterval(timer)
	}, [])

	const features = [
		{
			icon: Trophy,
			title: "Championship Finals",
			description: "The ultimate showdown between zone winners"
		},
		{
			icon: Zap,
			title: "Live Coverage",
			description: "Real-time updates and live streaming"
		},
		{
			icon: Target,
			title: "Premium Analytics",
			description: "Advanced statistics and performance insights"
		},
		{
			icon: Crown,
			title: "National Champions",
			description: "Crown the ultimate NHSF (UK) (UK) Dharmic Games champions"
		}
	]

	const stats = [
		{ label: "Zone Champions", value: "4", icon: Trophy },
		{ label: "Sports", value: "5+", icon: Target },
		{ label: "Expected Participants", value: "500+", icon: Users },
		{ label: "Days of Competition", value: "3", icon: Calendar }
	]

	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1 bg-gradient-to-br from-orange-50 to-red-50">
				{/* Hero Section */}
				<section className="relative overflow-hidden">
					<div className="pointer-events-none absolute inset-0">
						<div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
						<div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-red-200/40 blur-3xl" />
						<div className="absolute top-1/2 left-1/2 h-96 w-96 rounded-full bg-yellow-200/20 blur-3xl" />
					</div>

					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
						<div className="text-center space-y-8">
							<div className="space-y-4">
								<Badge variant="outline" className="px-4 py-2 text-sm font-medium bg-white/70 backdrop-blur">
									<Crown className="h-4 w-4 mr-2 text-orange-600" />
									NHSF (UK) Dharmic Games Nationals
								</Badge>
								
								<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent">
									NHSF (UK) Dharmic Games Nationals
								</h1>
								
								<p className="mx-auto max-w-3xl text-lg sm:text-xl text-gray-600">
									The ultimate championship where zone champions battle for the title of 
									<span className="font-semibold text-orange-600"> National NHSF (UK) Dharmic Games Champions</span>
								</p>
							</div>

							{/* Countdown Timer */}
							<div className="mx-auto max-w-2xl">
								<Card className="bg-white/80 backdrop-blur-sm border-orange-200">
									<CardHeader>
										<CardTitle className="text-center text-gray-800">Countdown to February 2026</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-4 gap-4 text-center">
											<div className="space-y-2">
												<div className="text-3xl sm:text-4xl font-bold text-orange-600">
													{timeLeft.days}
												</div>
												<div className="text-sm text-gray-600">Days</div>
											</div>
											<div className="space-y-2">
												<div className="text-3xl sm:text-4xl font-bold text-red-600">
													{timeLeft.hours}
												</div>
												<div className="text-sm text-gray-600">Hours</div>
											</div>
											<div className="space-y-2">
												<div className="text-3xl sm:text-4xl font-bold text-orange-600">
													{timeLeft.minutes}
												</div>
												<div className="text-sm text-gray-600">Minutes</div>
											</div>
											<div className="space-y-2">
												<div className="text-3xl sm:text-4xl font-bold text-red-600">
													{timeLeft.seconds}
												</div>
												<div className="text-sm text-gray-600">Seconds</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</section>

				{/* Stats Section */}
				<section className="py-16 bg-white/50">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
							{stats.map((stat, index) => (
								<Card key={index} className="text-center bg-white/80 backdrop-blur-sm">
									<CardContent className="pt-6">
										<div className="flex flex-col items-center space-y-3">
											<div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
												<stat.icon className="h-6 w-6 text-white" />
											</div>
											<div>
												<div className="text-2xl font-bold text-gray-900">{stat.value}</div>
												<div className="text-sm text-gray-600">{stat.label}</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="py-16">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="text-center space-y-4 mb-12">
							<h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
								What to Expect
							</h2>
							<p className="text-lg text-gray-600 max-w-2xl mx-auto">
								The most prestigious tournament in NHSF (UK) (UK) Dharmic Games history
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{features.map((feature, index) => (
								<Card key={index} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
									<CardContent className="pt-6">
										<div className="space-y-4 text-center">
											<div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
												<feature.icon className="h-8 w-8 text-white" />
											</div>
											<div>
												<h3 className="text-lg font-semibold text-gray-900 mb-2">
													{feature.title}
												</h3>
												<p className="text-sm text-gray-600">
													{feature.description}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</section>

				{/* Tournament Info */}
				<section className="py-16 bg-gradient-to-r from-orange-500 to-red-500">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="text-center space-y-8">
							<div className="space-y-4">
								<h2 className="text-3xl sm:text-4xl font-bold text-white">
									Zone Champions Compete
								</h2>
								<p className="text-lg text-orange-100 max-w-3xl mx-auto">
									Winners from North & Central Zone and London & South Zone tournaments 
									will battle it out for the ultimate championship title.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
								<Card className="bg-white/10 backdrop-blur-sm border-white/20">
									<CardContent className="pt-6">
										<div className="text-center space-y-4">
											<div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
												<Trophy className="h-8 w-8 text-white" />
											</div>
											<div>
												<h3 className="text-xl font-semibold text-white mb-2">
													Zone Qualifiers
												</h3>
												<p className="text-orange-100">
													Top teams from each zone advance to nationals
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card className="bg-white/10 backdrop-blur-sm border-white/20">
									<CardContent className="pt-6">
										<div className="text-center space-y-4">
											<div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
												<Star className="h-8 w-8 text-white" />
								</div>
											<div>
												<h3 className="text-xl font-semibold text-white mb-2">
													National Champions
												</h3>
												<p className="text-orange-100">
													Crown the ultimate NHSF (UK) (UK) Dharmic Games champions
												</p>
								</div>
								</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</section>

				{/* Call to Action */}
				<section className="py-16">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="text-center space-y-6">
							<h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
								Get Ready for History
							</h2>
							<p className="text-lg text-gray-600 max-w-2xl mx-auto">
								Follow your zone's journey through the zonal tournaments and prepare for the 
								ultimate championship showdown in February 2026.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Button asChild size="lg" className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
									<a href="/zonals">View Zonal Tournaments</a>
								</Button>
								<Button asChild variant="outline" size="lg">
									<a href="/teams">See All Teams</a>
								</Button>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	)
}


