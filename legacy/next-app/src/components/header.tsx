'use client'
// components/Header.tsx
import Link from "next/link"
// import { useState } from "react"

import { Button } from "@/components/ui/button"
// Assuming you have this hook or a similar one
// import { useMediaQuery } from "@/hooks/use-mobile";

// Placeholder for useMediaQuery if you don't have it yet
// const useMediaQuery = (query: string) => {
//   if (typeof window === 'undefined') return false; // Or a default value
//   const [matches, setMatches] = useState(window.matchMedia(query).matches);
//   useState(() => {
//     const mediaQueryList = window.matchMedia(query);
//     const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
//     mediaQueryList.addEventListener('change', listener);
//     return () => mediaQueryList.removeEventListener('change', listener);
//   }, [query]);
//   return matches;
// };


export function Header() {

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
          <Link href="/articles" className="text-slate-300 hover:text-white">
            Articles
          </Link>
          <Link href="/rankings?year=2025" className="text-slate-300 hover:text-white">
            Rankings
          </Link>
          <Button variant="outline" className="bg-red-600 border-slate-600 text-white hover:bg-red-700 hidden">
            SIGN IN
          </Button>
        </nav>
      </header>
  )
}