export interface Participant {
  slot: number;
  name: string | null;
  memberId?: string | null;
  color?: string;
  iconUrl?: string | null;
  acknowledgedResult?: boolean;
}

export interface Prize {
  name: string;
  imageUrl?: string | null;
  newImageFile?: File | null;
  rank?: 'miss' | 'uncommon' | 'common' | 'rare' | 'epic';
}

export interface Line {
  fromIndex: number;
  toIndex: number;
  y: number;
}

export interface Doodle extends Line {
  memberId: string;
  createdAt?: string;
}

export interface Point {
  x: number;
  y: number;
  line?: Line | Doodle;
}

export interface Tracer {
  name: string;
  slot: number;
  color: string;
  path: Point[];
  pathIndex: number;
  x: number;
  y: number;
  isFinished: boolean;
  celebrated: boolean;
  stopY?: number;
}

export interface LotteryData {
  participants: Participant[]; 
  prizes: Prize[];
  lines?: Line[];
  doodles?: Doodle[];
  results?: Record<string, any>;
  status?: string;
  displayMode?: string;
}

export interface RevealedPrize {
  participantName: string | null;
  prize: Prize;
  prizeIndex: number;
  revealProgress: number;
}
