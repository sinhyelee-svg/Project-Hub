import React, { useState, useEffect } from 'react';
import { VideoItem, VideoStatus } from '../types';
import { STATUS_META } from '../data';
import { Search, Plus, Trash2, Sliders, ChevronDown, Check, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditableInputProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  placeholder?: string;
}

const EditableInput: React.FC<EditableInputProps> = ({
  value,
  onSave,
  className,
  placeholder,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
};

interface VideoListTableProps {
  videos: VideoItem[];
  onAddVideo: (name: string) => void;
  onDeleteVideo: (id: string) => void;
  onUpdateVideoField: <K extends keyof VideoItem>(id: string, field: K, value: VideoItem[K]) => void;
}

export const VideoListTable: React.FC<VideoListTableProps> = ({
  videos,
  onAddVideo,
  onDeleteVideo,
  onUpdateVideoField,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'all'>('all');
  const [newVideoName, setNewVideoName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Active edit state for dropdowns
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoName.trim()) return;
    onAddVideo(newVideoName.trim());
    setNewVideoName('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col" id="video-list-table-container">
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center" id="list-filter-bar">
        {/* Search & Filter */}
        <div className="flex flex-1 flex-wrap gap-2.5 max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="영상 제목 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">상태 필터:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VideoStatus | 'all')}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700"
            >
              <option value="all">전체 상태</option>
              {Object.keys(STATUS_META).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5"
            id="toggle-add-video-btn"
          >
            <Plus className="w-4 h-4" />
            <span>새 비디오 추가</span>
          </button>
        </div>
      </div>

      {/* Add Video Drawer */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-200 bg-slate-50/70 overflow-hidden"
            id="add-video-panel"
          >
            <form onSubmit={handleAddVideoSubmit} className="p-4 flex gap-2 max-w-lg">
              <input
                type="text"
                placeholder="추가할 영상 제목 입력..."
                value={newVideoName}
                onChange={(e) => setNewVideoName(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 font-medium"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all"
                id="submit-add-video-btn"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-all"
                id="cancel-add-video-btn"
              >
                취소
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[380px] pb-40" id="video-table-scroller">
        <table className="min-w-[950px] w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs font-bold font-display">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4 min-w-[220px]">영상명</th>
              <th className="py-3 px-4 w-[160px]">상태</th>
              <th className="py-3 px-4 min-w-[200px]">진행률</th>
              <th className="py-3 px-4 min-w-[220px]">비고</th>
              <th className="py-3 px-4 w-16 text-center">삭제</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-medium">
                  검색 결과에 맞는 영상이 없습니다.
                </td>
              </tr>
            ) : (
              filteredVideos.map((video, idx) => {
                const meta = STATUS_META[video.status] || STATUS_META['대기'];
                const isOpen = activeDropdownId === video.id;

                return (
                  <tr
                    key={video.id}
                    className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700 text-xs transition-colors"
                    id={`video-row-${video.id}`}
                  >
                    {/* No */}
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-400">
                      {video.no}
                    </td>

                    {/* Video Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <EditableInput
                        value={video.name}
                        onSave={(val) => onUpdateVideoField(video.id, 'name', val)}
                        className="w-full bg-transparent hover:bg-slate-100/50 focus:bg-white px-1.5 py-1 rounded-md border border-transparent focus:border-slate-300 focus:outline-hidden transition-all text-slate-800 font-semibold"
                      />
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 relative">
                      <div>
                        <button
                          type="button"
                          onClick={() => setActiveDropdownId(isOpen ? null : video.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg border text-left font-medium transition-all ${meta.bg} ${meta.border} ${meta.color}`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>

                        {isOpen && (
                          <>
                            {/* Overlay to close */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdownId(null)}
                            />
                            <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                              {Object.entries(STATUS_META).map(([statusKey, statusMeta]) => {
                                const active = video.status === statusKey;
                                return (
                                  <button
                                    key={statusKey}
                                    type="button"
                                    onClick={() => {
                                      onUpdateVideoField(video.id, 'status', statusKey as VideoStatus);
                                      setActiveDropdownId(null);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-slate-50 ${
                                      active ? `${statusMeta.color} font-semibold bg-slate-50/60` : 'text-slate-600'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <span>{statusMeta.emoji}</span>
                                      <span>{statusMeta.label}</span>
                                    </span>
                                    {active && <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Progress Slider */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={video.progress}
                          onChange={(e) => onUpdateVideoField(video.id, 'progress', Number(e.target.value))}
                          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-hidden"
                          style={{
                            background: `linear-gradient(to right, ${
                              video.status === '완료'
                                ? '#10b981' // emerald-500
                                : video.status === '지연'
                                ? '#f43f5e' // rose-500
                                : '#4f46e5' // indigo-600
                            } 0%, ${
                              video.status === '완료'
                                ? '#10b981'
                                : video.status === '지연'
                                ? '#f43f5e'
                                : '#4f46e5'
                            } ${video.progress}%, #e2e8f0 ${video.progress}%, #e2e8f0 100%)`
                          }}
                        />
                        <span className="w-10 text-right font-bold text-slate-700 tabular-nums">
                          {video.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Remarks/Notes */}
                    <td className="py-3.5 px-4">
                      <EditableInput
                        value={video.remarks}
                        onSave={(val) => onUpdateVideoField(video.id, 'remarks', val)}
                        placeholder="특이사항 기록..."
                        className="w-full bg-transparent hover:bg-slate-100/50 focus:bg-white px-2 py-1 rounded-md border border-transparent focus:border-slate-300 focus:outline-hidden text-slate-600 font-medium transition-all"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onDeleteVideo(video.id)}
                        disabled={videos.length <= 1}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                        title="영상 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
