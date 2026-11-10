// components/DashboardPanel.tsx
'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize } from 'lucide-react';

interface DashboardPanelProps {
  title: string;
  children: ReactNode;
  initialHeight?: string;
  className?: string;
  contentClassName?: string;
  headerActions?: ReactNode; // New prop for elements next to title or expand button
  onExpandToggle?: (isExpanded: boolean) => void;
}

export function DashboardPanel({
  title,
  children,
  initialHeight = 'h-auto',
  className = '',
  contentClassName = 'p-0', // Defaulting to no padding for full control by child
  headerActions,
  onExpandToggle,
}: DashboardPanelProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);
    if (onExpandToggle) {
      onExpandToggle(newFullScreenState);
    }
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow || 'auto';
    }
    return () => {
      document.body.style.overflow = originalOverflow || 'auto';
    };
  }, [isFullScreen]);

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-95 p-4 sm:p-6 z-50 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            {headerActions && <div className="hidden sm:block">{headerActions}</div>} {/* Show header actions in FS */}
          </div>
          <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-white hover:bg-slate-700">
            <Minimize className="h-6 w-6" />
            <span className="sr-only">Minimize</span>
          </Button>
        </div>
        {/* Fullscreen header actions for mobile, if needed */}
        {headerActions && <div className="sm:hidden mb-3">{headerActions}</div>}
        <div className="flex-grow overflow-hidden bg-slate-800 p-0 rounded-md"> {/* No padding here */}
            {children} {/* Child should be a flex-col container now */}
        </div>
      </div>
    );
  }

  return (
    <Card className={`flex  bg-slate-800 text-white flex-col ${initialHeight} ${className} overflow-hidden`}> {/* Added overflow-hidden to card */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4 flex-shrink-0 border-b border-slate-700">
        <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-medium font-highlight">{title}</CardTitle>
            {headerActions} {/* Render header actions here */}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-muted-foreground hover:text-primary -mr-2">
          <Maximize className="h-5 w-5" />
          <span className="sr-only">Expand to Fullscreen</span>
        </Button>
      </CardHeader>
      <CardContent className={`flex-grow overflow-hidden ${contentClassName}`}> {/* overflow-hidden is key */}
        {/* Children will be a flex column that handles its own internal layout & scroll */}
        {children}
      </CardContent>
    </Card>
  );
}