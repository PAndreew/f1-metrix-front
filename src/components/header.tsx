"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMediaQuery } from "@/hooks/use-mobile"



export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-slate-700">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-red-600 text-white px-2 py-1 font-bold text-sm transform -skew-x-12">F1</div>
            <span className={`text-lg font-semibold tracking-wide font-highlight`}>F1 METRIX</span>
          </Link>
        </div>

        {isMobile ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {isMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-background border-b p-4 flex flex-col gap-4 animate-in slide-in-from-top">
                <div className="flex flex-col gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        Articles
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>Latest News</DropdownMenuItem>
                      <DropdownMenuItem>Race Reviews</DropdownMenuItem>
                      <DropdownMenuItem>Driver Profiles</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        Data
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>Race Statistics</DropdownMenuItem>
                      <DropdownMenuItem>Driver Rankings</DropdownMenuItem>
                      <DropdownMenuItem>Team Performance</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                  <Button className="w-full bg-red-600 hover:bg-red-700">Sign Up</Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <nav className="hidden md:flex items-center gap-6 text-base font-medium">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-bold">
                    Articles
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Latest News</DropdownMenuItem>
                  <DropdownMenuItem>Race Reviews</DropdownMenuItem>
                  <DropdownMenuItem>Driver Profiles</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="font-bold">
                    Data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Race Statistics</DropdownMenuItem>
                  <DropdownMenuItem>Driver Rankings</DropdownMenuItem>
                  <DropdownMenuItem>Team Performance</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Button variant="outline" className="font-medium">
                Sign In
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 font-medium">Sign Up</Button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
