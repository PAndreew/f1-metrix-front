// components/DashboardPanel.tsx
'use client'; // This component will manage its own full-screen state

import React, { useState, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize } from 'lucide-react'; // Icons

interface DashboardPanelProps {
  title: string;
  children: ReactNode;
  initialHeight?: string; // e.g., 'h-96' or 'h-[500px]'
  onExpandToggle?: (isExpanded: boolean) => void; // Optional callback
}

export function DashboardPanel({ title, children, initialHeight = 'h-auto', onExpandToggle }: DashboardPanelProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);
    if (onExpandToggle) {
      onExpandToggle(newFullScreenState);
    }
    // Basic full-screen toggle for the element itself, you might need more robust handling
    // for body scroll locking etc. for a true full-screen experience.
    if (newFullScreenState) {
        document.body.style.overflow = 'hidden'; // Prevent body scroll when panel is full screen
    } else {
        document.body.style.overflow = 'auto';
    }
  };

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-95 p-4 sm:p-8 z-50 flex flex-col overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-white hover:bg-slate-700">
            <Minimize className="h-6 w-6" />
            <span className="sr-only">Minimize</span>
          </Button>
        </div>
        <div className="flex-grow overflow-auto bg-slate-800 p-4 rounded-md">
            {children}
        </div>
      </div>
    );
  }

  return (
    <Card className={`flex flex-col ${initialHeight}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-muted-foreground hover:text-primary">
          <Maximize className="h-5 w-5" />
          <span className="sr-only">Expand</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto p-4 pt-2"> {/* Added padding control */}
        {children}
      </CardContent>
    </Card>
  );
}