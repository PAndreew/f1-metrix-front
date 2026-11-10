// components/YearlyRankingsPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardPanel } from '@/components/dashboard-panel';
import { YearSelector } from '@/components/year-selector';
import { DriverCard } from '@/components/driver-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DriverYearlyPerformanceRankings } from '@prisma/client';
import { ScrollArea } from "@/components/ui/scroll-area";

interface YearlyRankingsPanelProps {
  allRankingsForYear: DriverYearlyPerformanceRankings[];
  availableYears: number[];
  currentSelectedYear: number;
  defaultItemsShown: number;
}

export function YearlyRankingsPanel({
  allRankingsForYear,
  availableYears,
  currentSelectedYear,
  defaultItemsShown,
}: YearlyRankingsPanelProps) {
  const [isInternallyExpanded, setIsInternallyExpanded] = useState(false);
  const [isPanelFullScreen, setIsPanelFullScreen] = useState(false); // Tracks if the DashboardPanel is fullscreen

  useEffect(() => {
    // Reset internal expansion if year changes or panel exits fullscreen
    setIsInternallyExpanded(false);
  }, [currentSelectedYear, isPanelFullScreen]);

  const toggleInternalExpansion = () => {
    setIsInternallyExpanded(!isInternallyExpanded);
  };

  const rankingsToDisplay = isInternallyExpanded
    ? allRankingsForYear
    : allRankingsForYear.slice(0, defaultItemsShown);

  // YearSelector to be passed to DashboardPanel's headerActions
  const yearSelectorComponent = (
    <YearSelector availableYears={availableYears} currentYear={currentSelectedYear} />
  );

  return (
    <DashboardPanel
      title={`${currentSelectedYear} Rankings`}
      initialHeight="h-[480px] sm:h-[530px]" // Overall panel height
      contentClassName="p-0 flex flex-col" // Panel's content area is a flex column with no padding
      headerActions={yearSelectorComponent}
      onExpandToggle={setIsPanelFullScreen} // Callback to update local state when DashboardPanel expands/contracts
    >
      {/* This div becomes the direct child of CardContent, and it's a flex column */}
      {/* It will manage the scrollable area and the fixed button at the bottom */}
      <div className="flex flex-col flex-grow overflow-hidden relative"> {/* Added relative for positioning fade */}
        
        {/* Scrollable middle part */}
        <ScrollArea
          className="flex-grow" // Takes up available space
          // Add bottom padding to ScrollArea to ensure content doesn't go under the "fixed" button
          // The padding should be roughly the height of the button container + desired spacing
          // e.g., if button container is 60px, padding-bottom might be 76px (60 + 16 for spacing)
          // This can also be achieved by adding margin-bottom to the inner content of ScrollArea
        >
          <div className="p-4 space-y-3 pb-[76px]"> {/* Added significant pb here */}
            {rankingsToDisplay.length > 0 ? (
              rankingsToDisplay.map((driver, index) =>
                (isInternallyExpanded || isPanelFullScreen) ? (
                  <DriverCard key={driver.id} driver={driver} rank={driver.yearly_rank ? parseInt(driver.yearly_rank.toFixed(0)) : index + 1} />
                ) : (
                  <Link
                    href={`/rankings?year=${currentSelectedYear}&driverId=${driver.driverid}#driver-${driver.driverid}`}
                    key={driver.id}
                    className="block p-3 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-sm sm:text-base">
                          {driver.yearly_rank?.toFixed(0)}. {driver.forename} {driver.surname}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-slate-400">
                        {driver.yearly_performance_score?.toFixed(3)}
                      </span>
                    </div>
                  </Link>
                )
              )
            ) : (
              <p className="text-center text-slate-400 py-10">No rankings found for {currentSelectedYear}.</p>
            )}
          </div>
        </ScrollArea>

        {/* Fixed button container at the bottom of the "flex-grow overflow-hidden relative" div */}
        {/* This container will have the gradient fade */}
        {allRankingsForYear.length > defaultItemsShown && (
          <div
            className="absolute bottom-0 left-0 right-0 p-4 pt-8 text-center flex-shrink-0 bg-gradient-to-t from-slate-800 via-slate-800 to-transparent"
            // For dark mode (slate-900 background on CardContent from DashboardPanel)
            // bg-gradient-to-t from-slate-900 via-slate-900 to-transparent (if DashboardPanel content has slate-900)
            // Adjust gradient colors to match your exact card content background.
            // Current `DashboardPanel` has `contentClassName="p-0"`, so the background
            // will be inherited from the `Card` itself or the `YearlyRankingsPanel` wrapper.
            // Assuming `Card`'s background is `bg-slate-800` (or similar for dark themes)
          >
            <Button variant="outline" onClick={toggleInternalExpansion} className="w-full sm:w-auto">
              {isInternallyExpanded ? `Show Less (Top ${defaultItemsShown})` : `View All ${allRankingsForYear.length} Drivers for ${currentSelectedYear}`}
            </Button>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}