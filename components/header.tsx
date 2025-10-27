"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Trophy, Users, GamepadIcon, Settings, Play, UserPlus, GraduationCap, Shield } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-close menu after 10 seconds
  useEffect(() => {
    if (isMenuOpen) {
      menuTimeoutRef.current = setTimeout(() => {
        setIsMenuOpen(false)
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
  }, [isMenuOpen])

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isMenuOpen])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        const target = event.target as Element
        const mobileMenu = document.querySelector('[data-mobile-menu]')
        
        if (mobileMenu && !mobileMenu.contains(target) && !target.closest('[data-menu-button]')) {
          setIsMenuOpen(false)
        }
      }
    }

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <header className="bg-white shadow-md border-b-4 border-orange-500 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">NHSF (UK) Dharmic Games</h1>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
            <Link
              href="/teams"
              className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm px-3 py-2 rounded-md hover:bg-orange-50"
            >
              <Users className="w-4 h-4" />
              <span>Teams</span>
            </Link>
            <Link
              href="/live"
              className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm px-3 py-2 rounded-md hover:bg-orange-50"
            >
              <Play className="w-4 h-4" />
              <span>Live</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs ml-1">LIVE</Badge>
            </Link>
            <Link
              href="/zonals"
              className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm px-3 py-2 rounded-md hover:bg-orange-50"
            >
              <Trophy className="w-4 h-4" />
              <span>Zonals</span>
            </Link>
            <Link
              href="/nationals"
              className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm px-3 py-2 rounded-md hover:bg-orange-50"
            >
              <Trophy className="w-4 h-4" />
              <span>Nationals</span>
            </Link>
      <Link
        href="/registration"
        className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm px-3 py-2 rounded-md hover:bg-orange-50"
      >
        <UserPlus className="w-4 h-4" />
        <span>Registration</span>
      </Link>
      <Link
        href="/university/login"
        className="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors font-medium text-sm px-3 py-2 rounded-md hover:bg-orange-50"
      >
        <GraduationCap className="w-4 h-4" />
        <span>University Login</span>
      </Link>
          </nav>


          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2" 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            aria-label="Toggle menu"
            data-menu-button
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t bg-white" data-mobile-menu>
            <nav className="flex flex-col space-y-6">
              
              <Link
                href="/teams"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors py-2 px-4 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="w-5 h-5" />
                <span>Teams</span>
              </Link>
              <Link
                href="/live"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors py-2 px-4 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Play className="w-5 h-5" />
                <span>Live Results</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs ml-auto">LIVE</Badge>
              </Link>
              <Link
                href="/zonals"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors py-2 px-4 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Trophy className="w-5 h-5" />
                <span>Zonals</span>
              </Link>
              <Link
                href="/nationals"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors py-2 px-4 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Trophy className="w-5 h-5" />
                <span>Nationals</span>
              </Link>
      <Link
        href="/registration"
        className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors py-2 px-4 font-medium"
        onClick={() => setIsMenuOpen(false)}
      >
        <UserPlus className="w-5 h-5" />
        <span>Registration</span>
      </Link>
      <Link
        href="/university/login"
        className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors py-2 px-4 font-medium"
        onClick={() => setIsMenuOpen(false)}
      >
        <GraduationCap className="w-5 h-5" />
        <span>University Login</span>
      </Link>

            </nav>
          </div>
        )}
      </div>
      
    </header>
  )
}
