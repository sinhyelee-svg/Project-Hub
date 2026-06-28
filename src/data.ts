import { VideoItem, SchedulePhase, VideoStatus } from './types';

// Helper to generate dates array from July 1 to August 31
export function generateDateList(): string[] {
  const dates: string[] = [];
  // July: 1 to 31
  for (let d = 1; d <= 31; d++) {
    dates.push(`7/${d}`);
  }
  // August: 1 to 31
  for (let d = 1; d <= 31; d++) {
    dates.push(`8/${d}`);
  }
  return dates;
}

export const DATE_LIST = generateDateList();

// Helper to assign a value to a date range in the schedule record
function fillScheduleRange(
  schedule: Record<string, SchedulePhase>,
  startDay: number,
  endDay: number,
  month: 7 | 8,
  phase: SchedulePhase
) {
  for (let d = startDay; d <= endDay; d++) {
    schedule[`${month}/${d}`] = phase;
  }
}

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'video-1',
    no: 1,
    name: '메인 영상',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 1, 30, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-2',
    no: 2,
    name: '[릴스] 정면보고 자기 얘기하는',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 5, 16, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-3',
    no: 3,
    name: '[릴스] 손글씨 ; 폰트로 대체',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 8, 14, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-4',
    no: 4,
    name: '[릴스] 아이들 사전 인터뷰 모음',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 11, 18, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-5',
    no: 5,
    name: '[릴스] 어안렌즈 Before&After',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 13, 18, 7, '대기');
      s['7/20'] = '대기';
      return s;
    })(),
  },
  {
    id: 'video-6',
    no: 6,
    name: '[릴스] 위드베어 주고 받기(인생네컷 st.)',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 16, 18, 7, '대기');
      fillScheduleRange(s, 20, 23, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-7',
    no: 7,
    name: '[릴스] 위드베어 소개영상',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 20, 26, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-8',
    no: 8,
    name: '[릴스] 예솔님&로추추',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 22, 29, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-9',
    no: 9,
    name: '[릴스] 퀸 오브 피스 아이들 인터뷰 모음',
    status: '대기',
    progress: 0,
    remarks: '',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 25, 31, 7, '대기');
      fillScheduleRange(s, 1, 2, 8, '대기');
      return s;
    })(),
  },
];

export const PHASE_META: Record<
  Exclude<SchedulePhase, ''>,
  { label: string; color: string; bg: string; border: string; emoji: string }
> = {
  '대기': {
    label: '대기',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    emoji: '🤍',
  },
  '가편 편집': {
    label: '가편 편집',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    emoji: '🎨',
  },
  '1차 피드백': {
    label: '1차 피드백',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    emoji: '💬',
  },
  '종편 편집': {
    label: '종편 편집',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    emoji: '🎬',
  },
  '최종 피드백': {
    label: '최종 피드백',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    emoji: '📝',
  },
  '마스터 전달': {
    label: '마스터 전달',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    emoji: '🚀',
  },
  '완료': {
    label: '완료',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    emoji: '✅',
  },
  '지연': {
    label: '지연',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    emoji: '⚠️',
  },
};

export const STATUS_META: Record<
  VideoStatus,
  { label: string; color: string; bg: string; border: string; emoji: string }
> = PHASE_META;
