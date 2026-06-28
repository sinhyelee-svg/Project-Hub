import React from 'react';
import { VideoItem, VideoStatus } from '../types';
import { STATUS_META, PHASE_META } from '../data';
import { ArrowLeft, ArrowRight, Video, FileText, BarChart } from 'lucide-react';
import { motion } from 'motion/react';

interface KanbanBoardProps {
  videos: VideoItem[];
  onUpdateVideoStatus: (id: string, newStatus: VideoStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ videos, onUpdateVideoStatus }) => {
  const columns: { status: VideoStatus; title: string; meta: any }[] = [
    { status: '대기', title: '🤍 대기', meta: STATUS_META['대기'] },
    { status: '가편 편집', title: '🎨 가편 편집', meta: STATUS_META['가편 편집'] },
    { status: '1차 피드백', title: '💬 1차 피드백', meta: STATUS_META['1차 피드백'] },
    { status: '종편 편집', title: '🎬 종편 편집', meta: STATUS_META['종편 편집'] },
    { status: '최종 피드백', title: '📝 최종 피드백', meta: STATUS_META['최종 피드백'] },
    { status: '마스터 전달', title: '🚀 마스터 전달', meta: STATUS_META['마스터 전달'] },
    { status: '완료', title: '✅ 완료', meta: STATUS_META['완료'] },
    { status: '지연', title: '⚠️ 지연', meta: STATUS_META['지연'] },
  ];

  // Helper to move video status
  const moveVideo = (video: VideoItem, direction: 'prev' | 'next') => {
    const statuses: VideoStatus[] = [
      '대기',
      '가편 편집',
      '1차 피드백',
      '종편 편집',
      '최종 피드백',
      '마스터 전달',
      '완료',
      '지연'
    ];
    const currentIdx = statuses.indexOf(video.status);
    let targetIdx = currentIdx;

    if (direction === 'prev' && currentIdx > 0) {
      targetIdx = currentIdx - 1;
    } else if (direction === 'next' && currentIdx < statuses.length - 1) {
      targetIdx = currentIdx + 1;
    }

    if (targetIdx !== currentIdx) {
      onUpdateVideoStatus(video.id, statuses[targetIdx]);
    }
  };

  // Calculate some video-specific info (e.g., scheduled days count)
  const getScheduledDaysCount = (video: VideoItem) => {
    return Object.values(video.schedule).filter((v) => v !== '').length;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3" id="kanban-grid-container">
      {columns.map((col) => {
        const colVideos = videos.filter((v) => v.status === col.status);

        return (
          <div
            key={col.status}
            className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/70 flex flex-col min-h-[450px]"
            id={`kanban-col-${col.status}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${col.meta.bg} ${col.meta.border} ${col.meta.color}`}>
                  {col.title}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400 tabular-nums">
                {colVideos.length}
              </span>
            </div>

            {/* Column Body / Cards */}
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto" id={`kanban-cards-${col.status}`}>
              {colVideos.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-6 bg-white/40">
                  <span className="text-[11px] font-semibold text-slate-400 text-center">
                    비어있음
                  </span>
                </div>
              ) : (
                colVideos.map((video) => {
                  const scheduledDays = getScheduledDaysCount(video);
                  
                  return (
                    <motion.div
                      layout
                      key={video.id}
                      className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs rounded-xl p-3.5 transition-all flex flex-col gap-2.5 relative group"
                      id={`kanban-card-${video.id}`}
                    >
                      {/* Video Title */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-start gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5 tabular-nums">
                            #{video.no}
                          </span>
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            {video.name}
                          </span>
                        </div>
                      </div>

                      {/* Info Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <BarChart className="w-2.5 h-2.5" />
                          <span className="tabular-nums">일정 {scheduledDays}일</span>
                        </span>
                        {video.remarks && (
                          <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md max-w-full truncate flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" />
                            <span className="truncate" title={video.remarks}>{video.remarks}</span>
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                          <span>진행도</span>
                          <span className="font-bold text-slate-600 tabular-nums">{video.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              video.status === '완료'
                                ? 'bg-emerald-500'
                                : video.status === '지연'
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${video.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Actions (Move Buttons) */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
                        <button
                          onClick={() => moveVideo(video, 'prev')}
                          disabled={video.status === '대기'}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
                          title="이전 단계로"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold">이전</span>
                        </button>

                        <button
                          onClick={() => moveVideo(video, 'next')}
                          disabled={video.status === '완료'}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
                          title="다음 단계로"
                        >
                          <span className="text-[9px] font-bold">다음</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
