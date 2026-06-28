import React, { useState, useEffect } from 'react';
import { VideoItem, VideoStatus, SchedulePhase } from './types';
import { INITIAL_VIDEOS, DATE_LIST } from './data';
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

const LOCAL_STORAGE_KEY = 'campaign_video_timeline_data';

export default function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'table' | 'kanban' | 'calendar'>('timeline');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load from local storage or initialize
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as VideoItem[];
        // Sanitize and map old statuses/schedules to the new 8-phase values
        const sanitized = parsed.map(video => {
          let status = video.status;
          if ((status as string) === '진행중') {
            status = '가편 편집';
          } else if ((status as string) === '검수중') {
            status = '1차 피드백';
          }
          
          const validStatuses: VideoStatus[] = [
            '대기',
            '가편 편집',
            '1차 피드백',
            '종편 편집',
            '최종 피드백',
            '마스터 전달',
            '완료',
            '지연'
          ];
          
          if (!validStatuses.includes(status)) {
            status = '대기';
          }

          // Also sanitize the schedule phases
          const schedule = { ...video.schedule };
          Object.keys(schedule).forEach(date => {
            const phase = schedule[date];
            if ((phase as string) === '진행중') {
              schedule[date] = '가편 편집';
            } else if ((phase as string) === '검수중') {
              schedule[date] = '1차 피드백';
            } else if (phase && !validStatuses.includes(phase as any)) {
              schedule[date] = '대기';
            }
          });

          return {
            ...video,
            status,
            schedule,
          };
        });
        setVideos(sanitized);
      } catch (e) {
        console.error('Error loading data from localStorage, resetting to initial', e);
        setVideos(INITIAL_VIDEOS);
      }
    } else {
      setVideos(INITIAL_VIDEOS);
    }
  }, []);

  // Save to local storage whenever videos state changes
  const saveToLocalStorage = (data: VideoItem[]) => {
    setVideos(data);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

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
      case '마스터 전달':
        return { status: '마스터 전달', progress: 95 };
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
    const updated = videos.map((video) => {
      if (video.id === videoId) {
        const nextSchedule = {
          ...video.schedule,
          [date]: phase,
        };
        const calc = getCalculatedStatusAndProgress(nextSchedule);
        return {
          ...video,
          schedule: nextSchedule,
          status: calc ? calc.status : video.status,
          progress: calc ? calc.progress : video.progress,
        };
      }
      return video;
    });
    saveToLocalStorage(updated);
  };

  // 2. Update a range of dates in the Gantt timeline (Bulk update)
  const handleUpdateScheduleRange = (
    videoId: string,
    startIdx: number,
    endIdx: number,
    phase: SchedulePhase
  ) => {
    const updated = videos.map((video) => {
      if (video.id === videoId) {
        const newSchedule = { ...video.schedule };
        for (let i = startIdx; i <= endIdx; i++) {
          const date = DATE_LIST[i];
          if (date) {
            newSchedule[date] = phase;
          }
        }
        const calc = getCalculatedStatusAndProgress(newSchedule);
        return {
          ...video,
          schedule: newSchedule,
          status: calc ? calc.status : video.status,
          progress: calc ? calc.progress : video.progress,
        };
      }
      return video;
    });
    saveToLocalStorage(updated);
  };

  // 3. Update any metadata field in list view
  const handleUpdateVideoField = <K extends keyof VideoItem>(
    id: string,
    field: K,
    value: VideoItem[K]
  ) => {
    const updated = videos.map((video) => {
      if (video.id === id) {
        const item = { ...video, [field]: value };
        
        // Automation: Auto progress on status change based on unified 8-phase values
        if (field === 'status') {
          const status = value as VideoStatus;
          switch (status) {
            case '완료':
              item.progress = 100;
              break;
            case '마스터 전달':
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
          else if (progress >= 95) item.status = '마스터 전달';
          else if (progress >= 80) item.status = '최종 피드백';
          else if (progress >= 60) item.status = '종편 편집';
          else if (progress >= 40) item.status = '1차 피드백';
          else if (progress >= 20) item.status = '가편 편집';
          else if (progress > 0) item.status = '가편 편집';
          else item.status = '대기';
        }

        return item;
      }
      return video;
    });
    saveToLocalStorage(updated);
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
    saveToLocalStorage([...videos, newVideo]);
  };

  // 6. Delete a video from the campaign
  const handleDeleteVideo = (id: string) => {
    const filtered = videos.filter((v) => v.id !== id);
    // Re-index remaining videos' no values for clean spreadsheet-like sequencing
    const reindexed = filtered.map((v, index) => ({
      ...v,
      no: index + 1,
    }));
    saveToLocalStorage(reindexed);
  };

  // 7. Reset data back to default template
  const handleResetData = () => {
    const confirmReset = window.confirm(
      '모든 편집 내용이 초기화되며 구글 시트 기본값 상태로 되돌아갑니다. 진행하시겠습니까?'
    );
    if (!confirmReset) return;

    saveToLocalStorage(INITIAL_VIDEOS);
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
            saveToLocalStorage(parsed);
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
          <div className="space-y-1.5 flex-1">
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

          {/* Sidebar Footer User Details */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center gap-3 bg-stone-100 p-3 rounded-xl border border-stone-200/60">
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

              <div className="space-y-1 flex-1">
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

              <div className="pt-6 border-t border-slate-200">
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
