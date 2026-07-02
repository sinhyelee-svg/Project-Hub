import { VideoItem, SchedulePhase, VideoStatus } from './types';

// Helper to identify Sunday/Saturdays or Korean Holidays
export const isRedDay = (dateStr: string): boolean => {
  const [mStr, dStr] = dateStr.split('/');
  const month = parseInt(mStr);
  const dayNum = parseInt(dStr);
  
  // Specific requested holidays
  if (month === 7 && dayNum === 17) return true;
  if (month === 8 && dayNum === 17) return true; // 광복절 대체공휴일
  if (month === 9 && (dayNum === 24 || dayNum === 25 || dayNum === 26)) return true;
  
  // Weekends
  if (month === 7) {
    return (dayNum + 2) % 7 === 6 || (dayNum + 2) % 7 === 0; // July 1 is Wed
  }
  if (month === 8) {
    return (dayNum + 5) % 7 === 6 || (dayNum + 5) % 7 === 0; // Aug 1 is Sat
  }
  if (month === 9) {
    return (dayNum + 1) % 7 === 6 || (dayNum + 1) % 7 === 0; // Sep 1 is Tue
  }
  return false;
};

// Helper to generate dates array from July 1 to September 30
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
  // September: 1 to 30
  for (let d = 1; d <= 30; d++) {
    dates.push(`9/${d}`);
  }
  return dates;
}

export const DATE_LIST = generateDateList();

// Helper to assign a value to a date range in the schedule record
function fillScheduleRange(
  schedule: Record<string, SchedulePhase>,
  startDay: number,
  endDay: number,
  month: 7 | 8 | 9,
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
    campaignName: '메인 캠페인',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 1, 30, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-2',
    no: 2,
    name: '정면보고 자기 얘기하는',
    status: '대기',
    progress: 0,
    remarks: '',
    campaignName: '릴스',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 5, 16, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-3',
    no: 3,
    name: '손글씨 ; 폰트로 대체',
    status: '대기',
    progress: 0,
    remarks: '',
    campaignName: '릴스',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 8, 14, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-4',
    no: 4,
    name: '아이들 사전 인터뷰 모음',
    status: '대기',
    progress: 0,
    remarks: '',
    campaignName: '릴스',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 11, 18, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-5',
    no: 5,
    name: '어안렌즈 Before&After',
    status: '대기',
    progress: 0,
    remarks: '',
    campaignName: '릴스',
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
    name: '위드베어 주고 받기(인생네컷 st.)',
    status: '대기',
    progress: 0,
    remarks: '',
    campaignName: '위드베어',
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
    name: '위드베어 소개영상',
    status: '대기',
    progress: 0,
    remarks: '',
    campaignName: '위드베어',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 20, 26, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-8',
    no: 8,
    name: '예솔님&로추추',
    status: '대기',
    progress: 0,
    remarks: '',
    campaignName: '릴스',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 22, 29, 7, '대기');
      return s;
    })(),
  },
  {
    id: 'video-9',
    no: 9,
    name: '퀸 오브 피스 아이들 인터뷰 모음',
    status: '대기',
    progress: 0,
    remarks: '',
    campaignName: '퀸 오브 피스',
    schedule: (() => {
      const s: Record<string, SchedulePhase> = {};
      fillScheduleRange(s, 25, 31, 7, '대기');
      fillScheduleRange(s, 1, 2, 8, '대기');
      return s;
    })(),
  },
];

export interface CampaignColorTheme {
  bg: string;
  text: string;
  border: string;
  badge: string;
  scheduleBg: string;
  barBg: string;
}

const CAMPAIGN_COLORS: CampaignColorTheme[] = [
  {
    bg: 'bg-blue-50/30',
    text: 'text-blue-700',
    border: 'border-blue-200/40',
    badge: 'bg-blue-50/30 border-blue-200 text-blue-700',
    scheduleBg: 'bg-blue-50/30',
    barBg: 'bg-blue-600',
  },
  {
    bg: 'bg-emerald-50/30',
    text: 'text-emerald-700',
    border: 'border-emerald-200/40',
    badge: 'bg-emerald-50/30 border-emerald-200 text-emerald-700',
    scheduleBg: 'bg-emerald-50/30',
    barBg: 'bg-emerald-600',
  },
  {
    bg: 'bg-purple-50/30',
    text: 'text-purple-700',
    border: 'border-purple-200/40',
    badge: 'bg-purple-50/30 border-purple-200 text-purple-700',
    scheduleBg: 'bg-purple-50/30',
    barBg: 'bg-purple-600',
  },
  {
    bg: 'bg-amber-50/30',
    text: 'text-amber-700',
    border: 'border-amber-200/40',
    badge: 'bg-amber-50/30 border-amber-200 text-amber-700',
    scheduleBg: 'bg-amber-50/30',
    barBg: 'bg-amber-600',
  },
  {
    bg: 'bg-rose-50/30',
    text: 'text-rose-700',
    border: 'border-rose-200/40',
    badge: 'bg-rose-50/30 border-rose-200 text-rose-700',
    scheduleBg: 'bg-rose-50/30',
    barBg: 'bg-rose-600',
  },
  {
    bg: 'bg-violet-50/30',
    text: 'text-violet-700',
    border: 'border-violet-200/40',
    badge: 'bg-violet-50/30 border-violet-200 text-violet-700',
    scheduleBg: 'bg-violet-50/30',
    barBg: 'bg-violet-600',
  },
  {
    bg: 'bg-teal-50/30',
    text: 'text-teal-700',
    border: 'border-teal-200/40',
    badge: 'bg-teal-50/30 border-teal-200 text-teal-700',
    scheduleBg: 'bg-teal-50/30',
    barBg: 'bg-teal-600',
  },
  {
    bg: 'bg-cyan-50/30',
    text: 'text-cyan-700',
    border: 'border-cyan-200/40',
    badge: 'bg-cyan-50/30 border-cyan-200 text-cyan-700',
    scheduleBg: 'bg-cyan-50/30',
    barBg: 'bg-cyan-600',
  },
];

export function getCampaignColor(campaignName?: string): CampaignColorTheme {
  if (!campaignName || !campaignName.trim()) {
    return {
      bg: 'bg-slate-50/80',
      text: 'text-slate-600',
      border: 'border-slate-200',
      badge: 'bg-slate-50 border-slate-200 text-slate-600',
      scheduleBg: 'bg-slate-50/10',
      barBg: 'bg-slate-400',
    };
  }
  
  const name = campaignName.trim();
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CAMPAIGN_COLORS.length;
  return CAMPAIGN_COLORS[index];
}

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
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    emoji: '🎞️',
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
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    emoji: '🎬',
  },
  '최종 피드백': {
    label: '최종 피드백',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    emoji: '📝',
  },
  '최종 수정': {
    label: '최종 수정',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    emoji: '🎬',
  },
  '완료': {
    label: '완료',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    emoji: '🧡',
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
