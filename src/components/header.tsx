'use client'
// components/Header.tsx
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Assuming you have this hook or a similar one
// import { useMediaQuery } from "@/hooks/use-mobile";

// Placeholder for useMediaQuery if you don't have it yet
const useMediaQuery = (query: string) => {
  if (typeof window === 'undefined') return false; // Or a default value
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useState(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', listener);
    return () => mediaQueryList.removeEventListener('change', listener);
  }, [query]);
  return matches;
};


export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)") // md breakpoint

  return (
    <header className="sticky-top flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-red-600 text-white px-2 py-1 font-bold text-sm transform -skew-x-12">F1</div>
              <span className={`text-lg font-semibold tracking-wide font-highlight`}>F1 METRIX</span>
            </Link>
          </div>
          <div className="relative">
          </div>
        </div>
        <nav className="flex items-center space-x-8">
          <a href="#" className="text-slate-300 hover:text-white">
            News
          </a>
          <a href="#" className="text-slate-300 hover:text-white">
            Teams
          </a>
          <a href="#" className="text-slate-300 hover:text-white">
            Standings
          </a>
          <a href="#" className="text-slate-300 hover:text-white">
            Schedule
          </a>
          <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
            SIGN IN
          </Button>
        </nav>
      </header>
  )
}