"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, subYears, addYears, getYear, differenceInWeeks } from "date-fns";
import { fr, enUS, ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { PostMeta } from "@/lib/types";
import { type Locale, type Dictionary } from "@/lib/i18n-config";

interface ActivityChartProps {
  posts: PostMeta[];
  onDateSelect: (date: Date | null) => void;
  locale: Locale;
  dict: Dictionary;
}

const DAYS_IN_WEEK = 7;
const DAY_LABEL_WIDTH = 28;
const GAP = 3;

const dateLocales = {
  fr: fr,
  en: enUS,
  ja: ja,
};

export function ActivityChart({ posts, onDateSelect, locale, dict }: ActivityChartProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [cellSize, setCellSize] = useState(10);
  const [viewingYear, setViewingYear] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = getYear(new Date());
  const displayedYear = getYear(viewingYear);
  const isCurrentYear = displayedYear === currentYear;

  useEffect(() => {
    const calculateCellSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const availableWidth = containerWidth - DAY_LABEL_WIDTH;
        const weeksForCalculation = 53;
        const totalGaps = (weeksForCalculation - 1) * GAP;
        const calculatedSize = Math.floor((availableWidth - totalGaps) / weeksForCalculation);
        setCellSize(Math.max(8, Math.min(14, calculatedSize)));
      }
    };

    calculateCellSize();
    window.addEventListener("resize", calculateCellSize);
    return () => window.removeEventListener("resize", calculateCellSize);
  }, []);

  const postsByDate = useMemo(() => {
    const map = new Map<string, PostMeta[]>();
    posts.forEach((post) => {
      const dateKey = format(parseISO(post.date), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, post]);
    });
    return map;
  }, [posts]);

  const { weeks, monthLabels } = useMemo(() => {
    const yearStart = new Date(displayedYear, 0, 1);
    const yearEnd = new Date(displayedYear, 11, 31);

    const startDate = startOfWeek(yearStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(yearEnd, { weekStartsOn: 0 });

    const weeksCount = differenceInWeeks(endDate, startDate) + 1;

    const weeks: Date[][] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let week = 0; week < weeksCount; week++) {
      const weekDays: Date[] = [];
      for (let day = 0; day < DAYS_IN_WEEK; day++) {
        const date = addDays(startDate, week * 7 + day);
        weekDays.push(date);

        const month = date.getMonth();
        const dateYear = getYear(date);
        if (month !== lastMonth && day === 0 && dateYear === displayedYear) {
          monthLabels.push({ label: format(date, "MMM", { locale: dateLocales[locale] }), weekIndex: week });
          lastMonth = month;
        }
      }
      weeks.push(weekDays);
    }

    return { weeks, monthLabels };
  }, [displayedYear, locale]);

  const postsInYear = useMemo(() => {
    return posts.filter(post => {
      const postYear = getYear(parseISO(post.date));
      return postYear === displayedYear;
    }).length;
  }, [posts, displayedYear]);

  const earliestPostYear = useMemo(() => {
    if (posts.length === 0) return currentYear;
    const years = posts.map(post => getYear(parseISO(post.date)));
    return Math.min(...years);
  }, [posts, currentYear]);

  const handlePreviousYear = () => {
    setViewingYear(prev => subYears(prev, 1));
    setSelectedDate(null);
    onDateSelect(null);
  };

  const handleNextYear = () => {
    setViewingYear(prev => addYears(prev, 1));
    setSelectedDate(null);
    onDateSelect(null);
  };

  const handleCellClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
      onDateSelect(null);
    } else {
      setSelectedDate(date);
      onDateSelect(date);
    }
  };

  const getIntensity = (date: Date): number => {
    if (getYear(date) !== displayedYear) return -1;
    const dateKey = format(date, "yyyy-MM-dd");
    const count = postsByDate.get(dateKey)?.length || 0;
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3;
  };

  const dayLabels = locale === 'ja'
    ? ["", "月", "", "水", "", "金", ""]
    : locale === 'fr'
    ? ["", "Lun", "", "Mer", "", "Ven", ""]
    : ["", "Mon", "", "Wed", "", "Fri", ""];

  const cellWithGap = cellSize + GAP;

  return (
    <div className="w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {dict.activity.writingActivity}
          </h2>
          <span className="text-lg font-semibold text-primary">{displayedYear}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">
            {postsInYear} {postsInYear === 1 ? dict.activity.postCount : dict.activity.postsCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousYear}
            disabled={displayedYear <= earliestPostYear - 1}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextYear}
            disabled={isCurrentYear}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Button>
        </div>
      </div>

      <div className="flex mb-2" style={{ marginLeft: DAY_LABEL_WIDTH }}>
        {monthLabels.map(({ label, weekIndex }, i) => (
          <div
            key={i}
            className="text-xs text-muted-foreground"
            style={{
              marginLeft: i === 0 ? `${weekIndex * cellWithGap}px` : undefined,
              width: i < monthLabels.length - 1
                ? `${(monthLabels[i + 1].weekIndex - weekIndex) * cellWithGap}px`
                : undefined
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="flex">
        <div className="flex flex-col" style={{ width: DAY_LABEL_WIDTH, gap: GAP }}>
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

        <div className="flex flex-1" style={{ gap: GAP }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col" style={{ gap: GAP }}>
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
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="h-5 text-sm text-muted-foreground">
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
            <span className="opacity-0">Placeholder</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{dict.activity.less}</span>
          <div className="flex" style={{ gap: 2 }}>
            <div className="w-[10px] h-[10px] rounded-sm bg-secondary/50" />
            <div className="w-[10px] h-[10px] rounded-sm bg-primary/40" />
            <div className="w-[10px] h-[10px] rounded-sm bg-primary/70" />
            <div className="w-[10px] h-[10px] rounded-sm bg-primary" />
          </div>
          <span>{dict.activity.more}</span>
        </div>
      </div>
    </div>
  );
}
