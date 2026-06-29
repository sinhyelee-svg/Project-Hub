import React, { useState } from 'react';
import { VideoItem, SchedulePhase } from '../types';
import { PHASE_META } from '../data';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface CalendarViewProps {
  videos: VideoItem[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ videos }) => {
  const [currentMonth, setCurrentMonth] = useState<7 | 8 | 9>(7); // 7 for July, 8 for August, 9 for September
  const [selectedDay, setSelectedDay] = useState<number>(1); // Currently selected day of the month

  // Number of days in each month
  const daysInMonth = currentMonth === 9 ? 30 : 31;

  // Get weekday of 1st day of month (in 2026)
  // 2026년 7월 1일은 수요일 (Wednesday) -> Sunday index = 3
  // 2026년 8월 1일은 토요일 (Saturday) -> Sunday index = 6
  // 2026년 9월 1일은 화요일 (Tuesday) -> Sunday index = 2
  const getFirstDayOffset = (month: 7 | 8 | 9) => {
    if (month === 7) return 3;
    if (month === 8) return 6;
    return 2;
  };

  const offset = getFirstDayOffset(currentMonth);
  const totalCells = daysInMonth + offset;
  const rows = Math.ceil(totalCells / 7);

  // Helper to get all videos scheduled for a specific date
  const getSchedulesForDate = (day: number) => {
    const dateKey = `${currentMonth}/${day}`;
    return videos
      .map((video) => {
        const phase = video.schedule[dateKey] || '';
        return { video, phase };
      })
      .filter((item) => item.phase !== '');
  };

  const selectedSchedules = getSchedulesForDate(selectedDay);

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  const handlePrevMonth = () => {
    if (currentMonth === 8) {
      setCurrentMonth(7);
      setSelectedDay(1);
    } else if (currentMonth === 9) {
      setCurrentMonth(8);
      setSelectedDay(1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 7) {
      setCurrentMonth(8);
      setSelectedDay(1);
    } else if (currentMonth === 8) {
      setCurrentMonth(9);
      setSelectedDay(1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="calendar-view-root">
      {/* Calendar Grid Section */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col" id="calendar-grid-card">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-5" id="calendar-header">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm font-display">
              2026년 {currentMonth}월 일정표
            </h3>
          </div>

          <div className="flex gap-1">
            <button
              onClick={handlePrevMonth}
              disabled={currentMonth === 7}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-3 py-1.5 text-slate-700 bg-slate-100 rounded-lg flex items-center justify-center min-w-[50px]">
              {currentMonth}월
            </span>
            <button
              onClick={handleNextMonth}
              disabled={currentMonth === 9}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2 font-display">
          {daysOfWeek.map((day, idx) => (
            <div key={day} className={idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-indigo-500' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1.5 flex-1" id="calendar-cells-grid">
          {/* Offsets (empty cells) */}
          {Array.from({ length: offset }).map((_, idx) => (
            <div key={`offset-${idx}`} className="bg-slate-50/50 rounded-lg aspect-square border border-transparent" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const isSelected = selectedDay === day;
            const daySchedules = getSchedulesForDate(day);
            const isWeekend = (day + offset - 1) % 7 === 0 || (day + offset - 1) % 7 === 6;

            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDay(day)}
                className={`relative min-h-[110px] rounded-xl border p-2 flex flex-col justify-start items-stretch text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-2xs ring-2 ring-indigo-600/10'
                    : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Day number */}
                <span
                  className={`text-xs font-bold mb-1.5 ${
                    isSelected
                      ? 'text-indigo-700 font-extrabold'
                      : isWeekend
                      ? (day + offset - 1) % 7 === 0
                        ? 'text-rose-500'
                        : 'text-indigo-500'
                      : 'text-slate-700'
                  }`}
                >
                  {day}
                </span>

                {/* Direct Detail Schedules */}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[72px] pr-0.5 scrollbar-thin">
                  {daySchedules.map(({ video, phase }) => {
                    const meta = PHASE_META[phase as Exclude<SchedulePhase, ''>];
                    return (
                      <div
                        key={video.id}
                        className={`text-[9px] px-1 py-0.5 rounded border leading-tight flex items-center justify-between gap-1 truncate ${meta?.bg || 'bg-slate-50'} ${meta?.border || 'border-slate-200'} ${meta?.color || 'text-slate-700'}`}
                        title={`${video.name}: ${phase}`}
                      >
                        <span className="truncate flex-1 font-bold">{video.name}</span>
                        <span className="shrink-0 text-[10px]">{meta?.emoji}</span>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Detail Column */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col" id="calendar-details-card">
        <h4 className="font-bold text-slate-800 text-sm mb-4 pb-3 border-b border-slate-100 flex items-center gap-1.5">
          <span className="text-indigo-600">📅 {currentMonth}월 {selectedDay}일</span>
          <span className="text-xs font-semibold text-slate-500">작업 상세 일정</span>
        </h4>

        {/* Selected date's schedules list */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto" id="calendar-day-schedules">
          {selectedSchedules.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-slate-200/50">
              <span className="text-xs font-bold text-slate-400">예정된 작업 일정이 없습니다.</span>
              <span className="text-[10px] text-slate-400 mt-1">드로잉 탭에서 일정을 색칠해보세요.</span>
            </div>
          ) : (
            selectedSchedules.map(({ video, phase }) => {
              const meta = PHASE_META[phase as Exclude<SchedulePhase, ''>];
              return (
                <div
                  key={video.id}
                  className="p-3 border border-slate-200/70 rounded-xl hover:border-slate-300 transition-all bg-slate-50/40 flex items-center justify-between gap-3"
                  id={`selected-schedule-${video.id}`}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">#{video.no}</span>
                    <span className="text-xs font-bold text-slate-800 truncate" title={video.name}>
                      {video.name}
                    </span>
                  </div>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${meta?.bg} ${meta?.border} ${meta?.color}`}>
                    <span>{meta?.emoji}</span>
                    <span>{meta?.label}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
