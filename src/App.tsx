import React, { useState, useEffect } from 'react';
import { VideoItem, VideoStatus, SchedulePhase } from './types';
import { INITIAL_VIDEOS, DATE_LIST, isRedDay, PHASE_META } from './data';
import { DashboardStats } from './components/DashboardStats';
import { GanttTimeline } from './components/GanttTimeline';
import { VideoListTable } from './components/VideoListTable';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  CalendarRange, 
  ListTodo, 
  LayoutGrid, 
  CalendarDays,
  FileCheck2,
  Info,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  subscribeToVideos, 
  saveVideoToFirestore, 
  deleteVideoFromFirestore, 
  resetVideosInFirestore 
} from './firebase';

const LOCAL_STORAGE_KEY = 'campaign_video_timeline_data';

export default function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'table' | 'kanban' | 'calendar'>('timeline');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Date and To Do configuration - computed based on Korea Standard Time (KST, UTC+9)
  const getTodayAndTomorrow = () => {
    const now = new Date();
    const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    const kstToday = new Date(utcTimestamp + (3600000 * 9));
    // Since the project timeline is planned for the year 2026, ensure the year is pinned to 2026
    if (kstToday.getFullYear() !== 2026) {
      kstToday.setFullYear(2026);
    }
    
    const kstTomorrow = new Date(kstToday);
    kstTomorrow.setDate(kstToday.getDate() + 1);
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    
    const todayMonth = kstToday.getMonth() + 1;
    const todayDate = kstToday.getDate();
    const todayDay = weekdays[kstToday.getDay()];
    
    const tomorrowMonth = kstTomorrow.getMonth() + 1;
    const tomorrowDate = kstTomorrow.getDate();
    const tomorrowDay = weekdays[kstTomorrow.getDay()];
    
    return {
      todayStr: `${todayMonth}/${todayDate}`,
      tomorrowStr: `${tomorrowMonth}/${tomorrowDate}`,
      labelToday: `${todayMonth}월 ${todayDate}일 (${todayDay})`,
      labelTomorrow: `${tomorrowMonth}월 ${tomorrowDate}일 (${tomorrowDay})`
    };
  };

  const { todayStr, tomorrowStr, labelToday, labelTomorrow } = getTodayAndTomorrow();

  // Filter tasks based on schedule keys
  const todayTasks = videos
    .map((v) => ({ video: v, phase: v.schedule[todayStr] || '' }))
    .filter((item) => item.phase !== '');

  const tomorrowTasks = videos
    .map((v) => ({ video: v, phase: v.schedule[tomorrowStr] || '' }))
    .filter((item) => item.phase !== '');

  // Real-time synchronization with Firebase Firestore
  useEffect(() => {
    // Determine the local cache as a starting fallback to avoid initial blank screen
    let initialFallback = INITIAL_VIDEOS;
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        initialFallback = JSON.parse(saved) as VideoItem[];
      } catch (e) {
        console.error('Error reading localStorage cache', e);
      }
    }

    // Subscribe to Firestore updates
    const unsubscribe = subscribeToVideos((syncedVideos) => {
      setVideos(syncedVideos);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(syncedVideos));
    }, initialFallback);

    return () => unsubscribe();
  }, []);


  // Helper to calculate status and progress based on schedule drawing
  const getCalculatedStatusAndProgress = (schedule: Record<string, SchedulePhase>): { status: VideoStatus; progress: number } | null => {
    const activePhases = Object.values(schedule).filter(p => p && (p as string) !== '');
    if (activePhases.length === 0) {
      return { status: '대기', progress: 0 };
    }

    // Check for '지연' first
    if (activePhases.includes('지연')) {
      return { status: '지연', progress: 50 };
    }

    // Iterate chronologically through DATE_LIST to find the latest non-empty painted phase
    let latestPhase: SchedulePhase = '';
    for (let i = DATE_LIST.length - 1; i >= 0; i--) {
      const d = DATE_LIST[i];
      if (schedule[d] && (schedule[d] as string) !== '') {
        latestPhase = schedule[d];
        break;
      }
    }

    if (!latestPhase) {
      return { status: '대기', progress: 0 };
    }

    switch (latestPhase) {
      case '완료':
        return { status: '완료', progress: 100 };
      case '최종 수정':
        return { status: '최종 수정', progress: 95 };
      case '최종 피드백':
        return { status: '최종 피드백', progress: 80 };
      case '종편 편집':
        return { status: '종편 편집', progress: 60 };
      case '1차 피드백':
        return { status: '1차 피드백', progress: 40 };
      case '가편 편집':
        return { status: '가편 편집', progress: 20 };
      case '대기':
        return { status: '대기', progress: 0 };
      case '지연':
        return { status: '지연', progress: 50 };
      default:
        return null;
    }
  };

  // 1. Update single cell in the Gantt timeline
  const handleUpdateSchedule = (videoId: string, date: string, phase: SchedulePhase) => {
    const video = videos.find((v) => v.id === videoId);
    if (!video) return;

    const nextSchedule = {
      ...video.schedule,
      [date]: phase,
    };
    const updatedVideo: VideoItem = {
      ...video,
      schedule: nextSchedule,
    };
    saveVideoToFirestore(updatedVideo);
  };

  // 2. Update a range of dates in the Gantt timeline (Bulk update)
  const handleUpdateScheduleRange = (
    videoId: string,
    startIdx: number,
    endIdx: number,
    phase: SchedulePhase,
    excludeRedDays?: boolean
  ) => {
    const video = videos.find((v) => v.id === videoId);
    if (!video) return;

    const newSchedule = { ...video.schedule };
    for (let i = startIdx; i <= endIdx; i++) {
      const date = DATE_LIST[i];
      if (date) {
        if (excludeRedDays && isRedDay(date)) {
          continue;
        }
        newSchedule[date] = phase;
      }
    }
    const updatedVideo: VideoItem = {
      ...video,
      schedule: newSchedule,
    };
    saveVideoToFirestore(updatedVideo);
  };

  // 3. Update any metadata field in list view
  const handleUpdateVideoField = <K extends keyof VideoItem>(
    id: string,
    field: K,
    value: VideoItem[K]
  ) => {
    const video = videos.find((v) => v.id === id);
    if (!video) return;

    const item = { ...video, [field]: value };
    
    // Automation: Auto progress on status change based on unified status values
    if (field === 'status') {
      const status = value as VideoStatus;
      switch (status) {
        case '완료':
          item.progress = 100;
          break;
        case '최종 수정':
          item.progress = 95;
          break;
        case '최종 피드백':
          item.progress = 80;
          break;
        case '종편 편집':
          item.progress = 60;
          break;
        case '1차 피드백':
          item.progress = 40;
          break;
        case '가편 편집':
          item.progress = 20;
          break;
        case '지연':
          item.progress = 50;
          break;
        case '대기':
          item.progress = 0;
          break;
      }
    } else if (field === 'progress') {
      const progress = value as number;
      if (progress >= 100) item.status = '완료';
      else if (progress >= 95) item.status = '최종 수정';
      else if (progress >= 80) item.status = '최종 피드백';
      else if (progress >= 60) item.status = '종편 편집';
      else if (progress >= 40) item.status = '1차 피드백';
      else if (progress >= 20) item.status = '가편 편집';
      else if (progress > 0) item.status = '가편 편집';
      else item.status = '대기';
    }

    saveVideoToFirestore(item);
  };

  // 4. Update status in Kanban Board view
  const handleUpdateVideoStatus = (id: string, newStatus: VideoStatus) => {
    handleUpdateVideoField(id, 'status', newStatus);
  };

  // 5. Add a new video to the campaign
  const handleAddVideo = (name: string) => {
    const maxNo = videos.reduce((max, v) => (v.no > max ? v.no : max), 0);
    const newVideo: VideoItem = {
      id: `video-${Date.now()}`,
      no: maxNo + 1,
      name,
      status: '대기',
      progress: 0,
      remarks: '',
      schedule: {},
    };
    saveVideoToFirestore(newVideo);
  };

  // 6. Delete a video from the campaign
  const handleDeleteVideo = (id: string) => {
    const filtered = videos.filter((v) => v.id !== id);
    // Re-index remaining videos' no values for clean spreadsheet-like sequencing
    const reindexed = filtered.map((v, index) => ({
      ...v,
      no: index + 1,
    }));
    resetVideosInFirestore(reindexed);
  };

  // 7. Reset data back to default template
  const handleResetData = () => {
    const confirmReset = window.confirm(
      '모든 편집 내용이 초기화되며 구글 시트 기본값 상태로 되돌아갑니다. 진행하시겠습니까?'
    );
    if (!confirmReset) return;

    resetVideosInFirestore(INITIAL_VIDEOS);
  };

  // 8. Export schedule state as a JSON file download
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(videos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'campaign_video_production_timeline.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 9. Import schedule state from JSON file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Quick validation check
          const isValid = parsed.every(
            (item) => item.id && typeof item.name === 'string' && typeof item.status === 'string'
          );
          if (isValid) {
            resetVideosInFirestore(parsed);
            alert('데이터 가져오기가 완료되었습니다!');
          } else {
            alert('올바르지 않은 일정 백업 파일 형식입니다.');
          }
        } else {
          alert('올바르지 않은 일정 백업 파일 형식입니다.');
        }
      } catch (err) {
        alert('파일을 읽는 도중 오류가 발생했습니다.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Clear input
    e.target.value = '';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased" id="app-root">
      {/* 1. Desktop Left Sidebar */}
      <nav className="w-64 bg-[#FAF9F5] flex flex-col shrink-0 hidden lg:flex border-r border-slate-200" id="sidebar-nav">
        <div className="p-6 flex-1 flex flex-col">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-blue-500/20">
              🎬
            </div>
            <div>
              <span className="text-slate-800 font-extrabold tracking-tight text-base block">Project Hub</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Campaign Video</span>
            </div>
          </div>

          {/* Navigation Links (replacing old Tab bar) */}
          <div className="space-y-1.5 mb-5 shrink-0">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-xs font-semibold ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:bg-stone-200/50 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-xs font-semibold ${
                activeTab === 'kanban'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:bg-stone-200/50 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Status</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-xs font-semibold ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:bg-stone-200/50 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-xs font-semibold ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-600 hover:bg-stone-200/50 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Workflow</span>
            </button>
          </div>

          {/* Today's To Do / Tomorrow's To Do Widget */}
          <div className="flex-1 overflow-y-auto space-y-5 mb-4 pr-1 scrollbar-thin flex flex-col min-h-0 border-t border-stone-200/75 pt-4" id="sidebar-todo-container">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 shrink-0">
              <span className="text-xs font-black text-stone-500 uppercase tracking-wider">Planner widget</span>
            </div>

            {/* Today's To Do */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black text-slate-800 flex items-center gap-1.5">
                  <span>📌</span>
                  <span>Today</span>
                </span>
                <span className="text-xs text-slate-500 font-bold">{labelToday}</span>
              </div>
              <div className="space-y-2">
                {todayTasks.length === 0 ? (
                  <div className="text-xs text-stone-500 bg-stone-200/10 rounded-xl p-3 text-center border border-dashed border-stone-200/80 font-medium">
                    오늘 일정이 없습니다.
                  </div>
                ) : (
                  todayTasks.map(({ video, phase }) => {
                    const meta = PHASE_META[phase as Exclude<SchedulePhase, ''>];
                    return (
                      <div
                        key={`today-${video.id}`}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs flex flex-col gap-1.5 hover:shadow-xs transition-shadow"
                      >
                        <div className="flex flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border leading-none shadow-3xs tracking-tight ${meta?.bg} ${meta?.color} ${meta?.border}`}>
                            {meta?.emoji} {meta?.label}
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-slate-800 leading-snug break-all" title={video.name}>
                          {video.name}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tomorrow's To Do */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black text-slate-800 flex items-center gap-1.5">
                  <span>🚀</span>
                  <span>Tomorrow</span>
                </span>
                <span className="text-xs text-slate-500 font-bold">{labelTomorrow}</span>
              </div>
              <div className="space-y-2">
                {tomorrowTasks.length === 0 ? (
                  <div className="text-xs text-stone-500 bg-stone-200/10 rounded-xl p-3 text-center border border-dashed border-stone-200/80 font-medium">
                    내일 일정이 없습니다.
                  </div>
                ) : (
                  tomorrowTasks.map(({ video, phase }) => {
                    const meta = PHASE_META[phase as Exclude<SchedulePhase, ''>];
                    return (
                      <div
                        key={`tomorrow-${video.id}`}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs flex flex-col gap-1.5 hover:shadow-xs transition-shadow"
                      >
                        <div className="flex flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border leading-none shadow-3xs tracking-tight ${meta?.bg} ${meta?.color} ${meta?.border}`}>
                            {meta?.emoji} {meta?.label}
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-slate-800 leading-snug break-all" title={video.name}>
                          {video.name}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Footer User Details */}
          <div className="pt-4 border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-3 bg-stone-100 p-2.5 rounded-xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 font-extrabold flex items-center justify-center text-xs border border-blue-500/20 shrink-0">
                SL
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-xs font-bold truncate">sinhye_lee</p>
                <p className="text-slate-500 text-[10px] font-semibold truncate">Video Editor</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Mobile Responsive Slide-over Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            {/* Drawer Container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#FAF9F5] border-r border-slate-200 z-50 lg:hidden flex flex-col p-6 text-slate-800"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">
                    🎬
                  </div>
                  <span className="text-slate-800 font-bold tracking-tight text-lg">Project Hub</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-stone-200/50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 mb-4 shrink-0">
                <button
                  onClick={() => {
                    setActiveTab('timeline');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'timeline'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-stone-200/50 hover:text-slate-900'
                  }`}
                >
                  <CalendarRange className="w-4 h-4" />
                  <span>Timeline</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('kanban');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'kanban'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-stone-200/50 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Status</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('calendar');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'calendar'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-stone-200/50 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Calendar</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('table');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'table'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-stone-200/50 hover:text-slate-900'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Workflow</span>
                </button>
              </div>

              {/* Mobile Today/Tomorrow Widget */}
              <div className="flex-1 overflow-y-auto space-y-5 mb-4 pr-1 border-t border-stone-200/75 pt-4" id="mobile-todo-container">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-black text-stone-500 uppercase tracking-wider">Planner widget</span>
                </div>

                {/* Today's To Do */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-black text-slate-800 flex items-center gap-1.5">
                      <span>📌</span>
                      <span>Today</span>
                    </span>
                    <span className="text-xs text-slate-500 font-bold">{labelToday}</span>
                  </div>
                  <div className="space-y-2">
                    {todayTasks.length === 0 ? (
                      <div className="text-xs text-stone-500 bg-stone-200/10 rounded-xl p-3 text-center border border-dashed border-stone-200/80 font-medium">
                        오늘 일정이 없습니다.
                      </div>
                    ) : (
                      todayTasks.map(({ video, phase }) => {
                        const meta = PHASE_META[phase as Exclude<SchedulePhase, ''>];
                        return (
                          <div
                            key={`m-today-${video.id}`}
                            className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs flex flex-col gap-1.5"
                          >
                            <div className="flex flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border leading-none shadow-3xs tracking-tight ${meta?.bg} ${meta?.color} ${meta?.border}`}>
                                {meta?.emoji} {meta?.label}
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-slate-800 leading-snug">
                              {video.name}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Tomorrow's To Do */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-black text-slate-800 flex items-center gap-1.5">
                      <span>🚀</span>
                      <span>Tomorrow</span>
                    </span>
                    <span className="text-xs text-slate-500 font-bold">{labelTomorrow}</span>
                  </div>
                  <div className="space-y-2">
                    {tomorrowTasks.length === 0 ? (
                      <div className="text-xs text-stone-500 bg-stone-200/10 rounded-xl p-3 text-center border border-dashed border-stone-200/80 font-medium">
                        내일 일정이 없습니다.
                  </div>
                    ) : (
                      tomorrowTasks.map(({ video, phase }) => {
                        const meta = PHASE_META[phase as Exclude<SchedulePhase, ''>];
                        return (
                          <div
                            key={`m-tomorrow-${video.id}`}
                            className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs flex flex-col gap-1.5"
                          >
                            <div className="flex flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border leading-none shadow-3xs tracking-tight ${meta?.bg} ${meta?.color} ${meta?.border}`}>
                                {meta?.emoji} {meta?.label}
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-slate-800 leading-snug">
                              {video.name}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 font-extrabold flex items-center justify-center text-xs border border-blue-500/20 shrink-0">
                    SL
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 text-xs font-bold truncate">sinhye_lee@worldvision.kr</p>
                    <p className="text-slate-500 text-[10px] mt-0.5 font-semibold">Video Editor</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-slate-50">
        
        {/* Top Header Panel */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40" id="app-header">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate flex items-center gap-1.5">
                <span>캠페인 영상 제작 일정 대시보드</span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full font-display">
                  구글 시트 연동형
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">
                Synced with Google Sheets • Live Production Dashboard
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2" id="campaign-toolbar">
            <button
              onClick={handleExportData}
              className="px-2.5 py-1.5 sm:px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5"
              title="백업 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">백업 다운로드</span>
            </button>

            <label className="px-2.5 py-1.5 sm:px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">백업 복원</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetData}
              className="px-2.5 py-1.5 sm:px-3.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5"
              title="시트 기본값으로 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">데이터 초기화</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto" id="content-container">
          
          {/* Dynamic Real-time Stats */}
          <DashboardStats videos={videos} />

          {/* Tab Content Panels with fade animations */}
          <div id="tab-content-container" className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {activeTab === 'timeline' && (
                  <GanttTimeline
                    videos={videos}
                    onUpdateSchedule={handleUpdateSchedule}
                    onUpdateScheduleRange={handleUpdateScheduleRange}
                  />
                )}

                {activeTab === 'table' && (
                  <VideoListTable
                    videos={videos}
                    onAddVideo={handleAddVideo}
                    onDeleteVideo={handleDeleteVideo}
                    onUpdateVideoField={handleUpdateVideoField}
                  />
                )}

                {activeTab === 'kanban' && (
                  <KanbanBoard
                    videos={videos}
                    onUpdateVideoStatus={handleUpdateVideoStatus}
                  />
                )}

                {activeTab === 'calendar' && (
                  <CalendarView videos={videos} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
}
