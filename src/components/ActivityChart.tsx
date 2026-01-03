/**
 * ACTIVITY CHART - src/components/ActivityChart.tsx
 * ==================================================
 *
 * A GitHub-style contribution/activity chart showing writing activity.
 * Each cell represents a day, with color intensity showing post count.
 *
 * WHY CLIENT COMPONENT?
 * ---------------------
 * Needs interactivity:
 * - useState for hover/selection state
 * - useRef for DOM measurement
 * - useEffect for resize listener
 * - Click handlers for date selection
 *
 * FEATURES:
 * - Full calendar year display (Jan 1 - Dec 31)
 * - Year navigation (previous/next buttons)
 * - Responsive cell sizing
 * - Hover tooltips
 * - Click to filter posts by date
 * - Localized month/day labels
 *
 * DATA FLOW:
 * - Receives ALL posts (across locales) from Server Component
 * - Builds date → post count map
 * - Renders grid of cells with appropriate colors
 * - Notifies parent when date is selected
 */
"use client";

import { useState, useMemo, useRef, useEffect } from "react";

// date-fns for date calculations
import {
  format,           // Format date to string
  startOfWeek,      // Get Sunday of a week
  endOfWeek,        // Get Saturday of a week
  addDays,          // Add days to a date
  isSameDay,        // Compare two dates
  parseISO,         // Parse ISO date string
  subYears,         // Subtract years
  addYears,         // Add years
  getYear,          // Get year from date
  differenceInWeeks // Calculate weeks between dates
} from "date-fns";

// Localized date formatting
import { fr, enUS, ja } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";

// Types (from types.ts, NOT blog.ts)
import type { PostMeta } from "@/lib/types";
import { type Locale, type Dictionary } from "@/lib/i18n-config";

// ============================================================================
// TYPES
// ============================================================================

interface ActivityChartProps {
  /** All posts from all locales */
  posts: PostMeta[];

  /** Callback when user clicks a date (null = cleared) */
  onDateSelect: (date: Date | null) => void;

  /** Current locale for formatting */
  locale: Locale;

  /** Translations */
  dict: Dictionary;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Days in a week (Sunday = 0) */
const DAYS_IN_WEEK = 7;

/** Width of day labels column (Mon, Wed, Fri) */
const DAY_LABEL_WIDTH = 28;

/** Gap between cells in pixels */
const GAP = 3;

/** Map locale to date-fns locale object */
const dateLocales = {
  fr: fr,
  en: enUS,
  ja: ja,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityChart({ posts, onDateSelect, locale, dict }: ActivityChartProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  /** Currently selected date (for highlighting and filtering) */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  /** Currently hovered date (for tooltip) */
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  /** Dynamic cell size based on container width */
  const [cellSize, setCellSize] = useState(10);

  /** Year being viewed (can navigate to previous years) */
  const [viewingYear, setViewingYear] = useState(new Date());

  /** Ref to container for measuring width */
  const containerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES
  // ---------------------------------------------------------------------------

  const currentYear = getYear(new Date());
  const displayedYear = getYear(viewingYear);
  const isCurrentYear = displayedYear === currentYear;

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * RESIZE HANDLER
   *
   * Calculates optimal cell size based on container width.
   * Runs on mount and window resize.
   *
   * useEffect with [] dependency runs once on mount.
   * The resize listener is cleaned up on unmount.
   */
  useEffect(() => {
    const calculateCellSize = () => {
      if (containerRef.current) {
        // Get available width (minus day labels)
        const containerWidth = containerRef.current.offsetWidth;
        const availableWidth = containerWidth - DAY_LABEL_WIDTH;

        // Calculate cell size to fit ~53 weeks
        const weeksForCalculation = 53;
        const totalGaps = (weeksForCalculation - 1) * GAP;
        const calculatedSize = Math.floor((availableWidth - totalGaps) / weeksForCalculation);

        // Clamp between 8-14px
        setCellSize(Math.max(8, Math.min(14, calculatedSize)));
      }
    };

    calculateCellSize();

    // Add resize listener
    window.addEventListener("resize", calculateCellSize);

    // Cleanup function (runs on unmount)
    return () => window.removeEventListener("resize", calculateCellSize);
  }, []); // Empty deps = run once

  // ---------------------------------------------------------------------------
  // MEMOIZED COMPUTATIONS
  // ---------------------------------------------------------------------------

  /**
   * POSTS BY DATE MAP
   *
   * Creates a Map: dateString → PostMeta[]
   * Used for O(1) lookup of posts on any date.
   *
   * useMemo only recalculates when `posts` changes.
   */
  const postsByDate = useMemo(() => {
    const map = new Map<string, PostMeta[]>();
    posts.forEach((post) => {
      const dateKey = format(parseISO(post.date), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, post]);
    });
    return map;
  }, [posts]);

  /**
   * CALENDAR GRID DATA
   *
   * Generates:
   * - weeks: 2D array of dates (weeks × days)
   * - monthLabels: positions for month names
   *
   * The grid shows a full calendar year:
   * - Starts from the Sunday before Jan 1
   * - Ends on the Saturday after Dec 31
   */
  const { weeks, monthLabels } = useMemo(() => {
    // Define year boundaries
    const yearStart = new Date(displayedYear, 0, 1);  // Jan 1
    const yearEnd = new Date(displayedYear, 11, 31); // Dec 31

    // Expand to full weeks (for clean grid)
    const startDate = startOfWeek(yearStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(yearEnd, { weekStartsOn: 0 });       // Saturday

    // Calculate total weeks
    const weeksCount = differenceInWeeks(endDate, startDate) + 1;

    // Build the grid
    const weeks: Date[][] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let week = 0; week < weeksCount; week++) {
      const weekDays: Date[] = [];

      for (let day = 0; day < DAYS_IN_WEEK; day++) {
        const date = addDays(startDate, week * 7 + day);
        weekDays.push(date);

        // Track month changes for labels
        const month = date.getMonth();
        const dateYear = getYear(date);
        if (month !== lastMonth && day === 0 && dateYear === displayedYear) {
          monthLabels.push({
            label: format(date, "MMM", { locale: dateLocales[locale] }),
            weekIndex: week
          });
          lastMonth = month;
        }
      }

      weeks.push(weekDays);
    }

    return { weeks, monthLabels };
  }, [displayedYear, locale]);

  /**
   * POSTS COUNT FOR DISPLAYED YEAR
   */
  const postsInYear = useMemo(() => {
    return posts.filter(post => {
      const postYear = getYear(parseISO(post.date));
      return postYear === displayedYear;
    }).length;
  }, [posts, displayedYear]);

  /**
   * EARLIEST YEAR WITH POSTS
   *
   * Used to disable "previous" button when there's no more history.
   */
  const earliestPostYear = useMemo(() => {
    if (posts.length === 0) return currentYear;
    const years = posts.map(post => getYear(parseISO(post.date)));
    return Math.min(...years);
  }, [posts, currentYear]);

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------

  /** Navigate to previous year */
  const handlePreviousYear = () => {
    setViewingYear(prev => subYears(prev, 1));
    setSelectedDate(null);
    onDateSelect(null);
  };

  /** Navigate to next year */
  const handleNextYear = () => {
    setViewingYear(prev => addYears(prev, 1));
    setSelectedDate(null);
    onDateSelect(null);
  };

  /** Handle cell click - toggle selection */
  const handleCellClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      // Clicking same date = deselect
      setSelectedDate(null);
      onDateSelect(null);
    } else {
      // Select new date
      setSelectedDate(date);
      onDateSelect(date);
    }
  };

  // ---------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // ---------------------------------------------------------------------------

  /**
   * getIntensity
   *
   * Returns color intensity level (0-3) based on post count.
   * Returns -1 for dates outside the displayed year.
   *
   * @param date - Date to check
   * @returns -1 (hidden), 0 (no posts), 1-3 (post count intensity)
   */
  const getIntensity = (date: Date): number => {
    // Hide dates from other years
    if (getYear(date) !== displayedYear) return -1;

    const dateKey = format(date, "yyyy-MM-dd");
    const count = postsByDate.get(dateKey)?.length || 0;

    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3; // 3+ posts
  };

  // Localized day labels (only show Mon, Wed, Fri for space)
  const dayLabels = locale === 'ja'
    ? ["", "月", "", "水", "", "金", ""]
    : locale === 'fr'
    ? ["", "Lun", "", "Mer", "", "Ven", ""]
    : ["", "Mon", "", "Wed", "", "Fri", ""];

  // Cell size including gap
  const cellWithGap = cellSize + GAP;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full min-w-[320px]" ref={containerRef}>
      {/*
        HEADER: Title + Year + Navigation
      */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {dict.activity.writingActivity}
          </h2>
          <span className="text-base sm:text-lg font-semibold text-primary">{displayedYear}</span>
        </div>

        {/* Year navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2">
            {postsInYear} {postsInYear === 1 ? dict.activity.postCount : dict.activity.postsCount}
          </span>

          {/* Previous year button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousYear}
            disabled={displayedYear <= earliestPostYear - 1}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            {/* Left chevron icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </Button>

          {/* Next year button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextYear}
            disabled={isCurrentYear}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            {/* Right chevron icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Button>
        </div>
      </div>

      {/*
        MAIN GRID WITH MONTH LABELS

        Structure:
        - Day labels column (Mon, Wed, Fri) with empty header cell
        - Weeks as columns with month labels on top
      */}
      <div className="flex">
        {/* Day labels column */}
        <div className="flex flex-col flex-shrink-0" style={{ width: DAY_LABEL_WIDTH }}>
          {/* Empty cell above day labels (space for month labels) */}
          <div className="h-5 mb-1" />
          {/* Day labels */}
          <div className="flex flex-col" style={{ gap: GAP }}>
            {dayLabels.map((day, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground flex items-center"
                style={{ height: cellSize }}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Weeks grid with month labels */}
        <div className="flex" style={{ gap: GAP }}>
          {weeks.map((week, weekIndex) => {
            // Check if this week starts a new month
            const monthLabel = monthLabels.find(m => m.weekIndex === weekIndex);

            return (
              <div key={weekIndex} className="flex flex-col">
                {/* Month label cell */}
                <div
                  className="h-5 mb-1 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap"
                  style={{ width: cellSize }}
                >
                  {monthLabel?.label || ''}
                </div>
                {/* Week days */}
                <div className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((date, dayIndex) => {
                    const intensity = getIntensity(date);
                    const isSelected = selectedDate && isSameDay(selectedDate, date);
                    const dateKey = format(date, "yyyy-MM-dd");
                    const postsOnDate = postsByDate.get(dateKey) || [];
                    const today = new Date();
                    const isFuture = date > today;
                    const isOutsideYear = intensity === -1;
                    const isDisabled = isOutsideYear;

                    return (
                      <button
                        key={dayIndex}
                        onClick={() => !isDisabled && handleCellClick(date)}
                        onMouseEnter={() => !isOutsideYear && setHoveredDate(date)}
                        onMouseLeave={() => setHoveredDate(null)}
                        disabled={isDisabled}
                        style={{ width: cellSize, height: cellSize }}
                        className={`
                          rounded-sm transition-all flex-shrink-0
                          ${isOutsideYear ? 'bg-transparent cursor-default' : ''}
                          ${isFuture && !isOutsideYear ? 'bg-secondary/30' : ''}
                          ${!isDisabled ? 'cursor-pointer hover:ring-1 hover:ring-primary' : ''}
                          ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                          ${intensity === 0 && !isFuture ? 'bg-secondary/50' : ''}
                          ${intensity === 1 ? 'bg-primary/40' : ''}
                          ${intensity === 2 ? 'bg-primary/70' : ''}
                          ${intensity === 3 ? 'bg-primary' : ''}
                        `}
                        title={isOutsideYear ? '' : `${format(date, "MMM d, yyyy", { locale: dateLocales[locale] })}${postsOnDate.length > 0 ? ` - ${postsOnDate.length} ${postsOnDate.length === 1 ? dict.activity.postCount : dict.activity.postsCount}` : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/*
        FOOTER: Hover info + Legend

        h-5 = fixed height prevents layout shift when tooltip appears/disappears
      */}
      <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-3">
        {/* Hover tooltip - shows date and post count (hidden on mobile) */}
        <div className="h-5 text-xs sm:text-sm text-muted-foreground hidden sm:block">
          {hoveredDate ? (
            <>
              {format(hoveredDate, "EEEE, MMMM d, yyyy", { locale: dateLocales[locale] })}
              {postsByDate.get(format(hoveredDate, "yyyy-MM-dd"))?.length ? (
                <span className="text-primary ml-2">
                  {postsByDate.get(format(hoveredDate, "yyyy-MM-dd"))?.length} {dict.activity.postsCount}
                </span>
              ) : null}
            </>
          ) : (
            // Invisible placeholder maintains height
            <span className="opacity-0">Placeholder</span>
          )}
        </div>

        {/* Legend: Less → More */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
          <span>{dict.activity.less}</span>
          <div className="flex" style={{ gap: 2 }}>
            <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-sm bg-secondary/50" />
            <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-sm bg-primary/40" />
            <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-sm bg-primary/70" />
            <div className="w-2 h-2 sm:w-[10px] sm:h-[10px] rounded-sm bg-primary" />
          </div>
          <span>{dict.activity.more}</span>
        </div>
      </div>
    </div>
  );
}
