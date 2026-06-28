export type VideoStatus = 
  | '대기' 
  | '가편 편집' 
  | '1차 피드백' 
  | '종편 편집' 
  | '최종 피드백' 
  | '마스터 전달' 
  | '완료' 
  | '지연';

export type SchedulePhase = VideoStatus | '';

export interface VideoItem {
  id: string;
  no: number;
  name: string;
  status: VideoStatus;
  progress: number;
  remarks: string;
  schedule: Record<string, SchedulePhase>; // key is "M/D" (e.g., "7/1", "8/15")
}

export interface Campaign {
  id: string;
  name: string;
  videos: VideoItem[];
}
