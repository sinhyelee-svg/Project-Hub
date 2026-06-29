import React from 'react';
import { VideoItem, VideoStatus } from '../types';
import { STATUS_META } from '../data';
import { Video, BarChart3, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardStatsProps {
  videos: VideoItem[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ videos }) => {
  const total = videos.length;
  
  const avgProgress = total
    ? Math.round(videos.reduce((sum, v) => sum + v.progress, 0) / total)
    : 0;

  // 8 stages in chronological flow order as requested
  const stages: { status: VideoStatus; label: string; desc: string }[] = [
    { status: '대기', label: '대기', desc: '대기 상태' },
    { status: '가편 편집', label: '가편 편집', desc: '1차 컷편집' },
    { status: '1차 피드백', label: '1차 피드백', desc: '피드백 조율' },
    { status: '종편 편집', label: '종편 편집', desc: '종합 후반작업' },
    { status: '최종 피드백', label: '최종 피드백', desc: '최종 검수' },
    { status: '최종 수정', label: '최종 수정', desc: '최종 피드백 반영 및 수정' },
    { status: '완료', label: '완료', desc: '제작 최종 완료' },
    { status: '지연', label: '지연', desc: '일정 지연' },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
    }),
  };

  return (
    <div className="space-y-4 mb-6" id="dashboard-stats-container">
      {/* Overview Cards (Overall & Avg Progress) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="overview-metrics-grid">
        {/* Total Videos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
          id="stat-overall-videos"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Videos</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{total}<span className="text-sm font-medium text-slate-500 ml-1">개 영상</span></p>
            </div>
          </div>
          <div className="text-right text-xs font-semibold text-slate-400">
            전체 캠페인 관리 대상
          </div>
        </motion.div>

        {/* Avg Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
          id="stat-avg-progress"
        >
          <div className="flex items-center gap-3.5 w-full">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Progress</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <p className="text-2xl font-black text-slate-800">{avgProgress}%</p>
                {/* Micro progress bar */}
                <div className="hidden sm:block flex-1 max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden ml-2">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="text-right text-xs font-semibold text-slate-400 shrink-0">
            평균 제작 달성도
          </div>
        </motion.div>
      </div>

      {/* Unified Pipeline Row */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5" id="pipeline-container">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <span>워크플로우 진행 단계</span>
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3" id="pipeline-steps-grid">
          {stages.map((stage, idx) => {
            const count = videos.filter((v) => v.status === stage.status).length;
            const meta = STATUS_META[stage.status];
            const isLast = idx === stages.length - 1;

            return (
              <motion.div
                key={stage.status}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className={`relative rounded-lg p-3 border transition-all duration-200 ${meta.bg} ${meta.border} flex items-center justify-between`}
                id={`pipeline-step-${stage.status}`}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 truncate">
                    <span>{meta.emoji}</span>
                    <span>{stage.label}</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black shrink-0 ${meta.color} bg-white/70 shadow-2xs`}>
                    {count}
                  </span>
                </div>

                {/* Connective Flow Arrows for Desktop screens */}
                {!isLast && idx !== 6 && ( // don't connect after '완료' (index 6) or '지연' (index 7)
                  <div className="hidden lg:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 w-4 h-4 bg-white border border-slate-200 rounded-full items-center justify-center shadow-2xs">
                    <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
