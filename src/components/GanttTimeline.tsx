import React, { useState, useRef, useEffect } from 'react';
import { VideoItem, SchedulePhase } from '../types';
import { DATE_LIST, PHASE_META, STATUS_META, isRedDay } from '../data';
import { Palette, Trash2, CalendarRange, MousePointerClick, ChevronRight, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface GanttTimelineProps {
  videos: VideoItem[];
  onUpdateSchedule: (videoId: string, date: string, phase: SchedulePhase) => void;
  onUpdateScheduleRange: (videoId: string, startIdx: number, endIdx: number, phase: SchedulePhase, excludeRedDays?: boolean) => void;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  videos,
  onUpdateSchedule,
  onUpdateScheduleRange,
}) => {
  // Paintbrush state
  const [selectedBrush, setSelectedBrush] = useState<SchedulePhase | 'clear'>('대기');
  const [isPainting, setIsPainting] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Bulk fill state
  const [bulkVideoId, setBulkVideoId] = useState<string>(videos[0]?.id || '');
  const [bulkStartIdx, setBulkStartIdx] = useState<number>(0);
  const [bulkEndIdx, setBulkEndIdx] = useState<number>(10);
  const [bulkPhase, setBulkPhase] = useState<SchedulePhase>('대기');
  const [excludeRedDays, setExcludeRedDays] = useState<boolean>(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync state if videos list change
  useEffect(() => {
    if (videos.length > 0 && !bulkVideoId) {
      setBulkVideoId(videos[0].id);
    }
  }, [videos, bulkVideoId]);

  // Handle painting via dragging
  const handleMouseDown = (videoId: string, date: string) => {
    setIsPainting(true);
    const phaseValue = selectedBrush === 'clear' ? '' : selectedBrush;
    onUpdateSchedule(videoId, date, phaseValue);
  };

  const handleMouseEnter = (videoId: string, date: string) => {
    if (isPainting) {
      const phaseValue = selectedBrush === 'clear' ? '' : selectedBrush;
      onUpdateSchedule(videoId, date, phaseValue);
    }
  };

  const handleMouseUp = () => {
    setIsPainting(false);
  };

  // Add global mouse up listener to stop painting if mouse is released outside table
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleBulkApply = () => {
    if (!bulkVideoId) return;
    const start = Math.min(bulkStartIdx, bulkEndIdx);
    const end = Math.max(bulkStartIdx, bulkEndIdx);
    onUpdateScheduleRange(bulkVideoId, start, end, bulkPhase, excludeRedDays);
    setIsBulkOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col" id="gantt-timeline-container">
      {/* Timeline Controls Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between" id="gantt-controls">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Timeline</h3>
          </div>
        </div>

        {/* Brush Palette */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          {Object.entries(PHASE_META).map(([key, meta]) => {
            const phase = key as SchedulePhase;
            const isSelected = selectedBrush === phase;
            return (
              <button
                key={phase}
                onClick={() => setSelectedBrush(phase)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? `${meta.bg} ${meta.border} text-slate-900 ring-2 ring-indigo-500/20`
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
                title={`${phase} 브러시`}
              >
                <span>{meta.emoji}</span>
                <span>{phase}</span>
                {isSelected && <Check className="w-3 h-3 text-indigo-600 ml-0.5" />}
              </button>
            );
          })}
          <button
            onClick={() => setSelectedBrush('clear')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${
              selectedBrush === 'clear'
                ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/20'
                : 'border-transparent text-slate-600 hover:bg-slate-50'
            }`}
            title="일정 지우기"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>비우기</span>
            {selectedBrush === 'clear' && <Check className="w-3 h-3 text-rose-600 ml-0.5" />}
          </button>
        </div>

        {/* Bulk Fill Button */}
        <div>
          <button
            onClick={() => setIsBulkOpen(!isBulkOpen)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-all shadow-2xs flex items-center gap-1.5"
            id="bulk-fill-toggle-btn"
          >
            <CalendarRange className="w-4 h-4" />
            <span>기간 일괄 지정</span>
          </button>
        </div>
      </div>

      {/* Bulk Fill Drawer */}
      {isBulkOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-slate-200 bg-slate-50/70 p-4"
          id="bulk-fill-panel"
        >
          <div className="max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">대상 영상</label>
              <select
                value={bulkVideoId}
                onChange={(e) => setBulkVideoId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 font-medium"
              >
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.no}. {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">시작일</label>
              <select
                value={bulkStartIdx}
                onChange={(e) => setBulkStartIdx(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 font-medium"
              >
                {DATE_LIST.map((date, idx) => (
                  <option key={date} value={idx}>
                    {date}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">종료일</label>
              <select
                value={bulkEndIdx}
                onChange={(e) => setBulkEndIdx(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 font-medium"
              >
                {DATE_LIST.map((date, idx) => (
                  <option key={date} value={idx}>
                    {date}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">일정 상태</label>
              <select
                value={bulkPhase}
                onChange={(e) => setBulkPhase(e.target.value as SchedulePhase)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 font-medium"
              >
                {Object.keys(PHASE_META).map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
                <option value="">지우기 (빈 칸)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 h-9 mb-1">
              <input
                type="checkbox"
                id="exclude-red-days-checkbox"
                checked={excludeRedDays}
                onChange={(e) => setExcludeRedDays(e.target.checked)}
                className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="exclude-red-days-checkbox" className="text-xs font-semibold text-slate-600 select-none cursor-pointer">
                주말/공휴일 제외
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleBulkApply}
                className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-all shadow-2xs"
                id="apply-bulk-btn"
              >
                적용하기
              </button>
              <button
                onClick={() => setIsBulkOpen(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-all"
                id="cancel-bulk-btn"
              >
                취소
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Scrollable Timeline Grid */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto w-full relative border-slate-200 cursor-cell select-none"
        id="timeline-scroll-container"
      >
        <table className="min-w-[3100px] w-full border-collapse border-spacing-0 table-fixed">
          {/* Header Row 1: Month blocks */}
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              {/* Sticky columns spacing placeholders */}
              <th className="sticky left-0 bg-slate-50 z-30 w-[45px] min-w-[45px] p-0 m-0 border-r border-slate-200"></th>
              <th className="sticky left-[45px] bg-slate-50 z-30 w-[180px] min-w-[180px] p-0 m-0 border-r border-slate-200"></th>
              <th className="sticky left-[225px] bg-slate-50 z-30 w-[80px] min-w-[80px] p-0 m-0 border-r border-slate-200"></th>
              <th className="sticky left-[305px] bg-slate-50 z-30 w-[60px] min-w-[60px] p-0 m-0 border-r border-slate-200"></th>
              
              {/* Month Spans: 7/1 to 7/31 (31 cols), 8/1 to 8/31 (31 cols), 9/1 to 9/30 (30 cols) */}
              <th colSpan={31} className="bg-indigo-50/70 text-indigo-900 font-bold text-xs py-1.5 text-center tracking-wider border-r border-slate-200 font-display">
                7월 (JULY)
              </th>
              <th colSpan={31} className="bg-sky-50/70 text-sky-900 font-bold text-xs py-1.5 text-center tracking-wider border-r border-slate-200 font-display">
                8월 (AUGUST)
              </th>
              <th colSpan={30} className="bg-emerald-50/70 text-emerald-900 font-bold text-xs py-1.5 text-center tracking-wider border-slate-200 font-display">
                9월 (SEPTEMBER)
              </th>
            </tr>

            {/* Header Row 2: Days */}
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="sticky left-0 bg-slate-100 z-30 w-[45px] min-w-[45px] text-center text-xs font-bold py-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                No
              </th>
              <th className="sticky left-[45px] bg-slate-100 z-30 w-[180px] min-w-[180px] text-left text-xs font-bold px-3 py-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] truncate">
                영상명
              </th>
              <th className="sticky left-[225px] bg-slate-100 z-30 w-[80px] min-w-[80px] text-center text-xs font-bold py-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                상태
              </th>
              <th className="sticky left-[305px] bg-slate-100 z-30 w-[60px] min-w-[60px] text-center text-xs font-bold py-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                진행률
              </th>

              {/* July days */}
              {Array.from({ length: 31 }).map((_, d) => {
                const dayNum = d + 1;
                const dayStr = `${dayNum}`;
                const isHolidayOrWeekend = isRedDay(`7/${dayNum}`);
                return (
                  <th
                    key={`july-${dayStr}`}
                    className={`text-center text-[10px] font-semibold w-7 min-w-7 py-2 border-r border-slate-100 ${
                      isHolidayOrWeekend ? 'bg-rose-50/40 text-rose-500' : 'text-slate-500'
                    }`}
                  >
                    {dayStr}
                  </th>
                );
              })}

              {/* August days */}
              {Array.from({ length: 31 }).map((_, d) => {
                const dayNum = d + 1;
                const dayStr = `${dayNum}`;
                const isHolidayOrWeekend = isRedDay(`8/${dayNum}`);
                return (
                  <th
                    key={`august-${dayStr}`}
                    className={`text-center text-[10px] font-semibold w-7 min-w-7 py-2 border-r border-slate-100 ${
                      isHolidayOrWeekend ? 'bg-rose-50/40 text-rose-500' : 'text-slate-500'
                    }`}
                  >
                    {dayStr}
                  </th>
                );
              })}

              {/* September days */}
              {Array.from({ length: 30 }).map((_, d) => {
                const dayNum = d + 1;
                const dayStr = `${dayNum}`;
                const isHolidayOrWeekend = isRedDay(`9/${dayNum}`);
                return (
                  <th
                    key={`september-${dayStr}`}
                    className={`text-center text-[10px] font-semibold w-7 min-w-7 py-2 border-r border-slate-100 ${
                      isHolidayOrWeekend ? 'bg-rose-50/40 text-rose-500' : 'text-slate-500'
                    }`}
                  >
                    {dayStr}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Grid Rows */}
          <tbody>
            {videos.map((video) => (
              <tr 
                key={video.id} 
                className="hover:bg-slate-50/50 border-b border-slate-100 h-10 transition-colors"
                id={`timeline-row-${video.id}`}
              >
                {/* No */}
                <td className="sticky left-0 bg-white z-20 w-[45px] min-w-[45px] text-center text-xs text-slate-500 font-medium py-1.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                  {video.no}
                </td>

                {/* Name */}
                <td className="sticky left-[45px] bg-white z-20 w-[180px] min-w-[180px] text-xs text-slate-800 font-medium px-3 py-1.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] truncate" title={video.name}>
                  {video.name}
                </td>

                {/* Status */}
                <td className="sticky left-[225px] bg-white z-20 w-[80px] min-w-[80px] text-center py-1.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${STATUS_META[video.status]?.bg} ${STATUS_META[video.status]?.color} ${STATUS_META[video.status]?.border}`}>
                    {video.status}
                  </span>
                </td>

                {/* Progress */}
                <td className="sticky left-[305px] bg-white z-20 w-[60px] min-w-[60px] text-center text-xs text-slate-600 font-bold py-1.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                  {video.progress}%
                </td>

                {/* Days of July, August & September */}
                {DATE_LIST.map((date, index) => {
                  const phase = video.schedule[date] || '';
                  const prevDate = index > 0 ? DATE_LIST[index - 1] : null;
                  const nextDate = index < DATE_LIST.length - 1 ? DATE_LIST[index + 1] : null;
                  
                  const prevPhase = prevDate ? (video.schedule[prevDate] || '') : '';
                  const nextPhase = nextDate ? (video.schedule[nextDate] || '') : '';
                  
                  const isConnectedLeft = phase !== '' && phase === prevPhase;
                  const isConnectedRight = phase !== '' && phase === nextPhase;

                  const meta = phase ? PHASE_META[phase as Exclude<SchedulePhase, ''>] : null;
                  
                  return (
                    <td
                      key={date}
                      onMouseDown={() => handleMouseDown(video.id, date)}
                      onMouseEnter={() => handleMouseEnter(video.id, date)}
                      className={`relative text-center border-r border-slate-100 p-0 h-10 transition-all select-none hover:opacity-85 overflow-visible ${
                        phase !== '' ? (isConnectedLeft ? 'z-10' : 'z-[15]') : 'z-0'
                      } ${meta ? meta.bg : (isRedDay(date) ? 'bg-rose-50/15' : 'bg-transparent')}`}
                      title={`${video.name} - ${date}: ${phase || '지정 없음'}`}
                    >
                      {/* Interactive block overlay */}
                      {phase && (
                        <div 
                          className={`absolute inset-y-1 flex items-center justify-center border overflow-visible ${meta?.border} ${meta?.bg} z-10
                            ${isConnectedLeft ? 'left-0 border-l-0 rounded-l-none' : 'left-0.5 rounded-l-sm'}
                            ${isConnectedRight ? 'right-0 border-r-0 rounded-r-none' : 'right-0.5 rounded-r-sm'}
                          `}
                        >
                          {!isConnectedLeft && (
                            <span className={`absolute left-1.5 text-[9px] font-extrabold ${meta?.color} whitespace-nowrap flex items-center gap-1 select-none pointer-events-none z-20`}>
                              <span className="text-[10px]" role="img" aria-label={phase}>
                                {meta?.emoji}
                              </span>
                              <span className="opacity-95 tracking-tighter">{meta?.label}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend Block */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-2 items-center text-xs text-slate-500" id="gantt-legend">
        <span className="font-semibold text-slate-700 flex items-center gap-1">
          <MousePointerClick className="w-3.5 h-3.5 text-slate-500" />
          범례 및 가이드:
        </span>
        <div className="flex flex-wrap gap-3">
          {Object.entries(PHASE_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`px-1 rounded border ${meta.bg} ${meta.border} text-[10px] flex items-center gap-1`}>
                <span>{meta.emoji}</span>
                <span className="font-medium text-slate-700">{meta.label}</span>
              </span>
            </div>
          ))}
          <div className="text-[11px] text-slate-400 font-medium">
            (마우스 클릭 후 옆으로 드래그하면 여러 날짜를 연속으로 색칠할 수 있습니다.)
          </div>
        </div>
      </div>
    </div>
  );
};
