export interface User {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  buffered: number;
}

export enum AppView {
  LANDING = 'LANDING',
  HOST_SETUP = 'HOST_SETUP',
  ROOM = 'ROOM',
}

export type PeerData = 
  | { type: 'CHAT'; payload: ChatMessage }
  | { type: 'SYNC'; payload: Partial<VideoState> }
  | { type: 'USER_JOINED'; payload: User }
  | { type: 'USER_LEFT'; payload: string }
  | { type: 'REQUEST_SYNC' };
