'use client'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronRight, Trophy, Users, Play, UserPlus, GraduationCap } from 'lucide-react'
import { useScroll, motion } from 'framer-motion'
import { TournamentCountdown } from '@/components/tournament-countdown'

const menuItems = [
    { name: 'Teams', href: '/teams', icon: 'Users' },
    { name: 'Live', href: '/live', icon: 'Play' },
    { name: 'Zonals', href: '/zonals', icon: 'Trophy' },
    { name: 'Nationals', href: '/nationals', icon: 'Trophy' },
    { name: 'Registration', href: '/registration', icon: 'UserPlus' },
    { name: 'University Login', href: '/university/login', icon: 'GraduationCap' },
]

export function HeroSection() {
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Function to attempt playing the video
    const playVideo = async () => {
      try {
        // Set video properties programmatically for better mobile support
        video.muted = true
        video.playsInline = true
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')
        
        // Attempt to play
        const playPromise = video.play()
        
        if (playPromise !== undefined) {
          await playPromise
          console.log('Video autoplay started successfully')
        }
      } catch (error) {
        console.log('Video autoplay failed, but will retry on user interaction:', error)
        
        // Fallback: try to play on any user interaction
        const playOnInteraction = async () => {
          try {
            await video.play()
            // Remove listeners after successful play
            document.removeEventListener('touchstart', playOnInteraction)
            document.removeEventListener('click', playOnInteraction)
            document.removeEventListener('scroll', playOnInteraction)
          } catch (e) {
            console.log('Retry failed:', e)
          }
        }
        
        document.addEventListener('touchstart', playOnInteraction, { once: true, passive: true })
        document.addEventListener('click', playOnInteraction, { once: true })
        document.addEventListener('scroll', playOnInteraction, { once: true, passive: true })
      }
    }

    // Small delay to ensure the video element is fully loaded
    const timeoutId = setTimeout(playVideo, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <>
      <HeroHeader />
      <main className="overflow-x-hidden">
        <section className="relative min-h-screen flex items-center">
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              webkit-playsinline="true"
              x-webkit-airplay="allow"
              className="w-full h-full object-cover"
            >
              <source src="/videos/National Dharmic Games 2025 is four days away! 🥳Get your teams ready and be fully prepared. Six.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-16 sm:py-20 lg:py-24">
            <div className="max-w-4xl text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                NHSF (UK) <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Dharmic&nbsp;Games</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
                Join the ultimate Zonals competition! Represent your zone and compete in exciting challenges across London, South, North, and Central zones.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-full w-full sm:w-auto">
                  <Link href="/teams">
                    <span>View Teams</span>
                    <ChevronRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white rounded-full bg-transparent backdrop-blur-sm w-full sm:w-auto">
                  <Link href="/live">
                    <span>Watch Live Results</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Tournament Countdown Section */}
        <section className="bg-gradient-to-br from-orange-50 to-red-50 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Tournament Countdown
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get ready for the ultimate Zonals competition! Check the countdown to each tournament.
              </p>
            </div>
            <TournamentCountdown />
          </div>
        </section>

        <section className="bg-gradient-to-br from-orange-50 to-red-50 pb-2">
          <div className="group relative m-auto max-w-7xl px-6">
            <div className="flex flex-col items-center md:flex-row gap-6">
              <div className="md:w-64 md:flex-shrink-0 md:border-r md:pr-6">
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-600 font-medium">NHSF (UK) Zones Competing</p>
                  <p className="text-xs text-gray-500 mt-1">2 Tournaments • 53 Universities</p>
                </div>
              </div>
              <div className="relative py-6 flex-1 overflow-hidden">
                <div className="flex animate-marquee">
                  {/* First set of logos */}
                  <div className="flex items-center space-x-8 shrink-0">
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-blue-600 font-bold text-lg">London Zone</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-blue-600 font-bold text-lg">South Zone</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-red-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-red-600 font-bold text-lg">North Zone</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-red-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-red-600 font-bold text-lg">Central Zone</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-orange-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-orange-600 font-bold text-lg">5 Sports</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-orange-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">🏆</span>
                      </div>
                      <span className="text-orange-600 font-bold text-lg">Dharmic Games</span>
                    </div>
                  </div>
                  {/* Duplicate set for seamless loop */}
                  <div className="flex items-center space-x-8 shrink-0">
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-blue-600 font-bold text-lg">London Zone</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-blue-600 font-bold text-lg">South Zone</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-red-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-red-600 font-bold text-lg">North Zone</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-red-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-red-600 font-bold text-lg">Central Zone</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-orange-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-orange-600 font-bold text-lg">5 Sports</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-orange-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">🏆</span>
                      </div>
                      <span className="text-orange-600 font-bold text-lg">Dharmic Games</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 absolute inset-y-0 left-0 w-20"></div>
              <div className="bg-gradient-to-l from-orange-50 absolute inset-y-0 right-0 w-20"></div>
              <ProgressiveBlur
                className="pointer-events-none absolute left-0 top-0 h-full w-20"
                direction="left"
                blurIntensity={1}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute right-0 top-0 h-full w-20"
                direction="right"
                blurIntensity={1}
              />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const { scrollYProgress } = useScroll()
    const menuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    // Auto-close menu after 10 seconds
    React.useEffect(() => {
        if (menuState) {
            menuTimeoutRef.current = setTimeout(() => {
                setMenuState(false)
            }, 10000) // 10 seconds
        } else {
            if (menuTimeoutRef.current) {
                clearTimeout(menuTimeoutRef.current)
                menuTimeoutRef.current = null
            }
        }

        return () => {
            if (menuTimeoutRef.current) {
                clearTimeout(menuTimeoutRef.current)
            }
        }
    }, [menuState])

    // Close menu on scroll
    React.useEffect(() => {
        const handleScroll = () => {
            if (menuState) {
                setMenuState(false)
            }
        }

        if (menuState) {
            window.addEventListener('scroll', handleScroll, { passive: true })
            return () => window.removeEventListener('scroll', handleScroll)
        }
    }, [menuState])

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuState) {
                const target = event.target as Element
                const mobileMenu = document.querySelector('[data-hero-mobile-menu]')
                
                if (mobileMenu && !mobileMenu.contains(target) && !target.closest('[data-hero-menu-button]')) {
                    setMenuState(false)
                }
            }
        }

        if (menuState) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [menuState])
    

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            // Only show white text when very close to top (hero section)
            setScrolled(latest > 0.02)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="group fixed z-20 w-full pt-2">
                <div className={cn('mx-auto max-w-7xl rounded-3xl px-4 sm:px-6 transition-all duration-300 lg:px-12', scrolled ? 'bg-white/95 backdrop-blur-2xl border border-orange-200 shadow-xl' : 'bg-black/10 backdrop-blur-sm')}>
                    <motion.div
                        key={1}
                        className={cn('relative flex flex-wrap items-center justify-between gap-4 sm:gap-6 py-3 duration-200 lg:gap-0 lg:py-6', scrolled && 'lg:py-4')}>
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <h1 className={cn("text-lg font-bold transition-colors duration-300", scrolled ? "text-gray-900" : "text-white drop-shadow-2xl")}>NHSF (UK) Dharmic Games</h1>
                        </Link>

                        {/* Desktop Navigation - Centered */}
                        <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
                            {menuItems.map((item, index) => {
                                const IconComponent = item.icon === 'Users' ? Users :
                                                    item.icon === 'Play' ? Play :
                                                    item.icon === 'Trophy' ? Trophy :
                                                    item.icon === 'UserPlus' ? UserPlus :
                                                    item.icon === 'GraduationCap' ? GraduationCap : Trophy;
                                
                                return (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        className={cn("flex items-center space-x-1 transition-colors font-medium text-sm px-3 py-2 rounded-md", scrolled ? "text-gray-700 hover:text-orange-600 hover:bg-orange-50" : "text-white hover:text-orange-300 hover:bg-white/10")}>
                                        <IconComponent className="w-4 h-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>


                        {/* Mobile menu button */}
                        <button 
                            className="lg:hidden p-2" 
                            onClick={() => setMenuState(!menuState)} 
                            aria-label="Toggle menu"
                            data-hero-menu-button
                        >
                            {menuState ? <X className={cn("w-6 h-6", scrolled ? "text-gray-800" : "text-white drop-shadow-2xl")} /> : <Menu className={cn("w-6 h-6", scrolled ? "text-gray-800" : "text-white drop-shadow-2xl")} />}
                        </button>


                        {menuState ? (
                        <div className="bg-white mb-8 w-full rounded-3xl border border-orange-200 p-8 shadow-2xl shadow-orange-300/20 lg:hidden" data-hero-mobile-menu>
                            <div className="space-y-8">
                                {/* Navigation Links */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Navigation</h3>
                                    <ul className="space-y-2">
                                        {menuItems.map((item, index) => {
                                            const IconComponent = item.icon === 'Users' ? Users :
                                                                item.icon === 'Play' ? Play :
                                                                item.icon === 'Trophy' ? Trophy :
                                                                item.icon === 'UserPlus' ? UserPlus :
                                                                item.icon === 'GraduationCap' ? GraduationCap : Trophy;
                                            
                                            return (
                                                <li key={index}>
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setMenuState(false)}
                                                        className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors py-2 px-4 font-medium">
                                                        <IconComponent className="w-5 h-5" />
                                                        <span>{item.name}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                                
                            </div>
                        </div>
                        ) : null}
                    </motion.div>
                </div>
            </nav>
            
        </header>
  )
}