import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SurgeryCase } from '../../../backend';
import { CalendarCaseCard } from '../../cases/components/CalendarCaseCard';
import {
  getWeekDays,
  filterCasesByDay,
  formatWeekRange,
  isCurrentWeek,
} from '../utils/calendarUtils';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyCalendarViewProps {
  cases: SurgeryCase[];
  onNavigateToCase?: (caseId: number) => void;
}

export function WeeklyCalendarView({ cases, onNavigateToCase }: WeeklyCalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = getWeekDays(weekOffset);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekRange = formatWeekRange(weekStart, weekEnd);
  const showingCurrentWeek = isCurrentWeek(weekDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setWeekOffset((o) => o - 1)}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{weekRange}</span>
          {!showingCurrentWeek && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-primary"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setWeekOffset((o) => o + 1)}
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 7-column calendar grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="grid grid-cols-7 min-w-[700px] h-full divide-x divide-border">
          {weekDays.map((day, idx) => {
            const dayCases = filterCasesByDay(cases, day);
            const isToday =
              day.getFullYear() === today.getFullYear() &&
              day.getMonth() === today.getMonth() &&
              day.getDate() === today.getDate();

            return (
              <div key={idx} className="flex flex-col min-h-0">
                {/* Day column header */}
                <div
                  className={cn(
                    'sticky top-0 z-10 px-2 py-2 text-center border-b border-border bg-background',
                    isToday && 'bg-primary/5'
                  )}
                >
                  <p
                    className={cn(
                      'text-xs font-semibold uppercase tracking-wide',
                      isToday ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {DAY_LABELS[idx]}
                  </p>
                  <p
                    className={cn(
                      'text-sm font-bold mt-0.5',
                      isToday
                        ? 'text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                        : 'text-foreground'
                    )}
                  >
                    {day.getDate()}
                  </p>
                  {dayCases.length > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                      {dayCases.length}
                    </span>
                  )}
                </div>

                {/* Cases for this day */}
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                  {dayCases.length === 0 ? (
                    <div className="flex items-center justify-center h-16 mt-2">
                      <p className="text-[10px] text-muted-foreground/50 text-center leading-tight">
                        No cases
                      </p>
                    </div>
                  ) : (
                    dayCases.map((surgeryCase) => (
                      <CalendarCaseCard
                        key={surgeryCase.id.toString()}
                        surgeryCase={surgeryCase}
                        onNavigateToCase={onNavigateToCase}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
